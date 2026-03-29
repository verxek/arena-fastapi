from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete
from sqlalchemy.orm import selectinload # Для оптимизации загрузки связей, если нужно
from typing import List, Optional
import os
import shutil
import uuid
import zipfile
import logging
from datetime import datetime
import docker
import time

from backend.app.database import get_db
from backend.app.models.task import Task
from backend.app.models.user import User
from backend.app.dependencies.auth import get_current_user
from backend.app.models.dictionaries import Task_Category, Difficulty_Level

router = APIRouter(prefix="/tasks", tags=["tasks"])

client = docker.from_env()
logger = logging.getLogger(__name__)

try:
    client = docker.from_env()
except docker.errors.DockerException as e:
    logger.error(f"Не удалось подключиться к Docker: {e}")
    client = None

# КОНФИГУРАЦИЯ 
BASE_UPLOAD_DIR = "uploads/tasks"
os.makedirs(BASE_UPLOAD_DIR, exist_ok=True)

def generate_unique_id():
    return str(uuid.uuid4())

def run_reference_solution_in_docker(
    solution_path: str, 
    input_path: str, 
    output_path: str, 
    time_limit: int, 
    memory_limit: int,
    task_dir: str = None  
):
    if not client:
        raise Exception("Docker клиент не инициализирован.")

    ext = os.path.splitext(solution_path)[1].lower()
    filename = os.path.basename(solution_path)
    

    if task_dir:
        # Если передали корневую папку задачи - используем её
        work_dir = os.path.abspath(task_dir)
        # Путь к решению внутри контейнера будет /app/solutions/solution.py
        container_sol_path = f"/app/solutions/{filename}"
        # Путь к входу внутри контейнера будет /app/tests/1.in
        container_input_filename = f"tests/{os.path.basename(input_path)}"
    else:
        # монтируем папку решения
        work_dir = os.path.abspath(os.path.dirname(solution_path))
        container_sol_path = f"/app/{filename}"
        container_input_filename = os.path.basename(input_path)

    timeout_seconds = max(5, (time_limit / 1000.0) + 2.0)
    mem_limit_str = f"{memory_limit}m"

    if ext == ".py":
        image = "python:3.9-slim"
        command = ["sh", "-c", f"python {container_sol_path} < /app/{container_input_filename}"]
        
    elif ext == ".cpp":
        image = "gcc:latest"
        binary_name = filename.replace(".cpp", "")
        # Для C++ бинарник тоже кладем в solutions
        command = ["sh", "-c", f"g++ -std=c++17 -O2 -o /app/solutions/{binary_name} {container_sol_path} && /app/solutions/{binary_name} < /app/{container_input_filename}"]
        
    else:
        raise ValueError(f"Неподдерживаемый язык: {ext}")

    try:
        logger.info(f"Запуск в Docker: {image} | Папка: {work_dir}")

        result_output = client.containers.run(
            image=image,
            command=command,
            volumes={
                work_dir: {'bind': '/app', 'mode': 'ro'}
            },
            stdout=True,
            stderr=True,
            detach=False,
            remove=True,
            network_disabled=True,
            mem_limit=mem_limit_str,
            nano_cpus=int(1 * 1e9),
        )

        with open(output_path, "wb") as outfile:
            outfile.write(result_output)
            
        logger.info(f"Успешно сгенерирован тест: {output_path}")

    except docker.errors.APIError as e:
        error_msg = str(e).lower()
        if "out of memory" in error_msg or "signal 9" in error_msg:
            raise Exception(f"Превышен лимит памяти ({memory_limit} МБ).")
        elif "no such file" in error_msg:
            raise Exception(f"Ошибка: файл не найден. Проверьте пути: решение={container_sol_path}, вход=/app/{container_input_filename}")
        else:
            raise Exception(f"Ошибка Docker API: {str(e)}")
            
    except FileNotFoundError:
        raise Exception(f"Входной файл не найден на хосте: {input_path}")
        
    except Exception as e:
        if "timeout" in str(e).lower() or "timed out" in str(e).lower():
            raise Exception(f"Превышен лимит времени ({time_limit} мс).")
        raise Exception(f"Ошибка выполнения кода в песочнице: {str(e)}")
    
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create_task(
    task_name: str = Form(...),
    statement: str = Form(...),
    difficulty_id: int = Form(...),
    category_id: int = Form(...),
    time_limit: int = Form(...),
    memory_limit: int = Form(...),
    tests_file: UploadFile = File(...),
    solution_file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #  Проверка уникальности названия
    stmt = select(Task).where(Task.task_name == task_name)
    result = await db.execute(stmt)
    existing_task = result.scalar_one_or_none()
    
    if existing_task:
        raise HTTPException(status_code=400, detail="Задача с таким названием уже существует")

    # запись в БД
    new_task = Task(
        task_name=task_name,
        statement=statement,
        difficulty=difficulty_id,
        category=category_id,
        time_limit=time_limit,
        memory_limit=memory_limit,
        author=current_user.user_id, 
        visibility=True,
        make_visible_after_contest=False
    )
    
    db.add(new_task)
    
    # чтобы получить ID нового объекта до коммита
    await db.flush() 
    
    task_id = new_task.task_id

    task_dir = os.path.join("uploads/tasks", str(task_id))
    tests_dir = os.path.join(task_dir, "tests")
    sol_dir = os.path.join(task_dir, "solutions")
    
    os.makedirs(tests_dir, exist_ok=True)
    os.makedirs(sol_dir, exist_ok=True)

    try:
        # Сохраняем эталонное решение
        sol_ext = os.path.splitext(solution_file.filename)[1]
        sol_filename = f"solution{sol_ext}"
        sol_path = os.path.join(sol_dir, sol_filename)
        
        with open(sol_path, "wb") as buffer:
            shutil.copyfileobj(solution_file.file, buffer)

        # архив с тестами
        zip_path = os.path.join(task_dir, "tests_raw.zip")
        with open(zip_path, "wb") as buffer:
            shutil.copyfileobj(tests_file.file, buffer)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tests_dir)
        os.remove(zip_path)

        # генерация .out файлов
        in_files = [f for f in os.listdir(tests_dir) if f.endswith('.in')]
        if not in_files:
            raise Exception("В архиве не найдено файлов .in")

        for in_file in in_files:
            in_path = os.path.join(tests_dir, in_file)
            out_file = in_file.replace('.in', '.out')
            out_path = os.path.join(tests_dir, out_file)
            
            run_reference_solution_in_docker(
                sol_path, in_path, out_path, time_limit, memory_limit, task_dir=task_dir
            )

    except Exception as e:
        await db.delete(new_task) 
        await db.commit()
        
        if os.path.exists(task_dir):
            shutil.rmtree(task_dir)
            
        raise HTTPException(status_code=500, detail=f"Ошибка обработки файлов: {str(e)}")

    await db.commit()
    await db.refresh(new_task)

    return {
        "task_id": new_task.task_id,
        "task_name": new_task.task_name,
        "tests_url": f"/static/tasks/{new_task.task_id}/tests/",
        "solution_url": f"/static/tasks/{new_task.task_id}/solutions/"
    }

@router.get("/", response_model=List[dict])
async def get_tasks(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # запрос всех задач
    stmt = select(Task)
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    
    result_list = []
    for t in tasks:
        cat_name = t.category_rel.category_name if t.category_rel else "Unknown"
        diff_name = t.difficulty_rel.diff_name if t.difficulty_rel else "Unknown"
        
        result_list.append({
            "task_id": t.task_id,
            "task_name": t.task_name,
            "author_id": t.author,
            "category_name": cat_name,
            "difficulty_name": diff_name,
            "created_at": t.created_at,
            "time_limit": t.time_limit,
            "memory_limit": t.memory_limit,
            "tests_url": f"/static/tasks/{t.task_id}/tests/",
            "solution_url": f"/static/tasks/{t.task_id}/solutions/"
        })
    return result_list

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Поиск задачи
    stmt = select(Task).where(Task.task_id == task_id)
    result = await db.execute(stmt)
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    

    # Удаление папки с файлами
    task_dir = os.path.join(BASE_UPLOAD_DIR, str(task_id))
    if os.path.exists(task_dir):
        shutil.rmtree(task_dir)

    # Удаление из БД
    await db.delete(task)
    await db.commit()
    
    return None

@router.get("/categories", response_model=List[dict])
async def get_categories(db: AsyncSession = Depends(get_db)): 
    stmt = select(Task_Category)
    result = await db.execute(stmt)
    categories = result.scalars().all()
    
    return [{"category_id": c.category_id, "category_name": c.category_name} for c in categories]

@router.get("/difficulties", response_model=List[dict])
async def get_difficulties(db: AsyncSession = Depends(get_db)):
    stmt = select(Difficulty_Level)
    result = await db.execute(stmt)
    difficulties = result.scalars().all()
    
    return [{"difficulty_id": d.difficulty_id, "diff_name": d.diff_name} for d in difficulties]