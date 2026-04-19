from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete
from sqlalchemy.orm import selectinload
from typing import List, Optional
import os
import shutil
import uuid
import zipfile
import logging
from datetime import datetime
import docker
import time
import json
from backend.app.worker.tasks import generate_task_tests

from backend.app.database import get_db
from backend.app.models.task import Task
from backend.app.models.user import User
from backend.app.dependencies.auth import get_current_user
from backend.app.models.dictionaries import Task_Category, Difficulty_Level

router = APIRouter(prefix="/tasks", tags=["tasks"])

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
    current_user: User = Depends(get_current_user),
    input_format: str = Form(None),
    output_format: str = Form(None),
    examples_json: str = Form(None)
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
        input_format=input_format,
        output_format=output_format,
        examples=json.loads(examples_json) if examples_json else [],
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
        await db.commit() 
        generate_task_tests.delay(
            task_id,
            time_limit,
            memory_limit
        )
        new_task.status = "GENERATING_TESTS"
        await db.commit()
        

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




@router.get("/batch")
async def get_tasks_batch(
    task_ids: str = Query(..., description="Task IDs separated by commas or repeated parameter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    import re
    ids_list = [int(x.strip()) for x in re.split(r'[,&]', task_ids) if x.strip()]
    
    result = await db.execute(
        select(Task).where(Task.task_id.in_(ids_list))
    )
    tasks = result.scalars().all()
    
    return [
        {
            "task_id": t.task_id,
            "task_name": t.task_name,
            "author_id": t.author,
            "category_name": t.category_rel.category_name,
            "difficulty_name": t.difficulty_rel.diff_name,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "time_limit": t.time_limit,
            "memory_limit": t.memory_limit,
            "tests_url": f"/static/tasks/{t.task_id}/tests/",
            "solution_url": f"/static/tasks/{t.task_id}/solutions/"
        }
        for t in tasks
    ]


@router.get("/{task_id}", response_model=dict)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Task).where(Task.task_id == task_id).options(
        selectinload(Task.category_rel),
        selectinload(Task.difficulty_rel)
    )
    result = await db.execute(stmt)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    return {
        "task_id": task.task_id,
        "task_name": task.task_name,
        "statement": task.statement,
        "author_id": task.author,
        "category_name": task.category_rel.category_name if task.category_rel else "Unknown",
        "difficulty_name": task.difficulty_rel.diff_name if task.difficulty_rel else "Unknown",
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "time_limit": task.time_limit,
        "memory_limit": task.memory_limit,

        "input_format": task.input_format,
        "output_format": task.output_format,
        "examples": task.examples or []
    }