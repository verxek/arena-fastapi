import os
import json
import shutil
import zipfile
from fastapi import HTTPException
from backend.app.models.task import Task
from backend.app.worker.tasks import generate_task_tests
from sqlalchemy import select
from typing import List
import re
from sqlalchemy.orm import selectinload
from backend.app.repositories.task import get_tasks_by_role
from backend.app.repositories.task import get_task_by_name, create_task, update_task_status

BASE_DIR = "uploads/tasks"

def parse_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ("true", "1", "yes", "on")
    return False


async def create_task_service(
    db,
    task_name,
    statement,
    difficulty_id,
    category_id,
    time_limit,
    memory_limit,
    tests_file,
    solution_file,
    current_user,
    input_format=None,
    output_format=None,
    examples_json=None,
    is_contest_task=True,
    make_visible_after=True,
    points: int = None
):
    # --- проверка уникальности ---
    if await get_task_by_name(db, task_name):
        raise HTTPException(400, "Задача с таким названием уже существует")

    make_visible = parse_bool(make_visible_after)
    visibility = not parse_bool(is_contest_task)

    # --- создание задачи ---
    new_task = await create_task(db, {
        "task_name": task_name,
        "statement": statement,
        "input_format": input_format,
        "output_format": output_format,
        "examples": json.loads(examples_json) if examples_json else [],
        "difficulty": difficulty_id,
        "category": category_id,
        "time_limit": time_limit,
        "memory_limit": memory_limit,
        "author": current_user.user_id,
        "visibility": visibility,
        "make_visible_after_contest": make_visible,
        "points": points
    })

    task_id = new_task.task_id

    # --- директории ---
    task_dir = os.path.join(BASE_DIR, str(task_id))
    tests_dir = os.path.join(task_dir, "tests")
    sol_dir = os.path.join(task_dir, "solutions")

    os.makedirs(tests_dir, exist_ok=True)
    os.makedirs(sol_dir, exist_ok=True)

    try:
        # --- решение ---
        sol_ext = os.path.splitext(solution_file.filename)[1]
        sol_path = os.path.join(sol_dir, f"solution{sol_ext}")

        with open(sol_path, "wb") as f:
            shutil.copyfileobj(solution_file.file, f)

        # --- тесты ---
        zip_path = os.path.join(task_dir, "tests.zip")

        with open(zip_path, "wb") as f:
            shutil.copyfileobj(tests_file.file, f)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(tests_dir)

        os.remove(zip_path)

        # --- commit ---
        await db.commit()

        # --- запуск генерации ---
        generate_task_tests.delay(task_id, time_limit, memory_limit)

        await update_task_status(db, new_task, "GENERATING_TESTS")

        return new_task

    except Exception as e:
        await db.rollback()

        if os.path.exists(task_dir):
            shutil.rmtree(task_dir)

        raise HTTPException(
            status_code=500,
            detail=f"Ошибка обработки файлов: {str(e)}"
        )
    
async def get_tasks_service(db, current_user, include_hidden: bool = False):
    stmt = select(Task)

    if current_user.role != "organizer":
        stmt = stmt.where(Task.visibility == True)

    else:
        if not include_hidden:
            stmt = stmt.where(
                (Task.visibility == True) |
                (Task.author == current_user.user_id)
            )
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
            "solution_url": f"/static/tasks/{t.task_id}/solutions/",
            "visibility": t.visibility,
            "points": t.points,

            "is_solved": any(
                sol.sol_task == t.task_id and sol.sol_user == current_user.user_id
                for sol in current_user.solutions
            )
        })

    return result_list

async def delete_task_service(db, task_id: int):
    # поиск задачи
    task = await db.get(Task, task_id)

    if not task:
        raise HTTPException(404, "Задача не найдена")

    # удаление файлов
    task_dir = os.path.join(BASE_DIR, str(task_id))

    if os.path.exists(task_dir):
        shutil.rmtree(task_dir)

    # удаление из БД
    await db.delete(task)
    await db.commit()


async def get_tasks_batch_service(db, task_ids: List[int]):
    """Получает задачи по списку ID (task_ids уже список целых чисел)""" 
    print(f"get_tasks_batch_service: received {len(task_ids)} IDs: {task_ids}")
    
    if not task_ids:
        return []
    
    result = await db.execute(
        select(Task).where(Task.task_id.in_(task_ids))
    )
    
    tasks = result.scalars().all()
    
    print(f"Found {len(tasks)} tasks in DB")
    
    return [
        {
            "task_id": t.task_id,
            "task_name": t.task_name,
            "author_id": t.author, 
            "category_name": t.category_rel.category_name if t.category_rel else "Unknown",
            "difficulty_name": t.difficulty_rel.diff_name if t.difficulty_rel else "Unknown",
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "time_limit": t.time_limit,
            "memory_limit": t.memory_limit,
            "tests_url": f"/static/tasks/{t.task_id}/tests/",
            "solution_url": f"/static/tasks/{t.task_id}/solutions/",
            "points": t.points
        }
        for t in tasks
    ]

async def get_task_service(db, task_id: int):
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
        "examples": task.examples or [],
        "points": task.points
    }