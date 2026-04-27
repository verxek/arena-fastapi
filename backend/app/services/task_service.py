import os
import json
import shutil
import zipfile
from fastapi import HTTPException
from backend.app.models.task import Task
from backend.app.worker.tasks import generate_task_tests
from sqlalchemy import select
import re
from sqlalchemy.orm import selectinload

BASE_DIR = "uploads/tasks"


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
    is_contest_task=False,
    make_visible_after=False
):
    # --- проверка уникальности ---
    result = await db.execute(
        select(Task).where(Task.task_name == task_name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(400, "Задача с таким названием уже существует")

    visibility = False if is_contest_task else True

    # --- создание задачи ---
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
        visibility=visibility,
        make_visible_after_contest=make_visible_after
    )

    db.add(new_task)
    await db.flush()

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

        new_task.status = "GENERATING_TESTS"
        await db.commit()

        return new_task

    except Exception as e:
        await db.rollback()

        if os.path.exists(task_dir):
            shutil.rmtree(task_dir)

        raise HTTPException(
            status_code=500,
            detail=f"Ошибка обработки файлов: {str(e)}"
        )
    

async def get_tasks_service(db, current_user):
    stmt = select(Task).where(Task.visibility == True)
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


def parse_task_ids(task_ids: str):
    return [int(x.strip()) for x in re.split(r'[,&]', task_ids) if x.strip()]


async def get_tasks_batch_service(db, task_ids: str):
    ids_list = parse_task_ids(task_ids)

    result = await db.execute(
        select(Task).where(Task.task_id.in_(ids_list))
    )

    tasks = result.scalars().all()

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
            "solution_url": f"/static/tasks/{t.task_id}/solutions/"
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
        "examples": task.examples or []
    }