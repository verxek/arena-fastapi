from fastapi import APIRouter, Depends, status, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete as sql_delete
from typing import List
import os
import uuid
import logging
from datetime import datetime
import docker
from backend.app.database import get_db
from fastapi import Query
from backend.app.models.user import User
from backend.app.dependencies.auth import get_current_user
from backend.app.models.dictionaries import Task_Category, Difficulty_Level
from backend.app.services.task_service import create_task_service, get_tasks_service, delete_task_service, get_tasks_batch_service, get_task_service

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

@router.post("/", status_code=201, response_model=dict)
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
    examples_json: str = Form(None),
    is_contest_task: bool = Form(False),
    make_visible_after: bool = Form(False),
    points: int = Form(None)
):
    task = await create_task_service(
        db=db,
        task_name=task_name,
        statement=statement,
        difficulty_id=difficulty_id,
        category_id=category_id,
        time_limit=time_limit,
        memory_limit=memory_limit,
        tests_file=tests_file,
        solution_file=solution_file,
        current_user=current_user,
        input_format=input_format,
        output_format=output_format,
        examples_json=examples_json,
        is_contest_task=is_contest_task,
        make_visible_after=make_visible_after,
        points=points
    )

    return {
        "task_id": task.task_id,
        "task_name": task.task_name,
        "tests_url": f"/static/tasks/{task.task_id}/tests/",
        "solution_url": f"/static/tasks/{task.task_id}/solutions/"
    }

@router.get("/", response_model=List[dict])
async def get_tasks(
    include_hidden: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_tasks_service(db, current_user, include_hidden)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await delete_task_service(db, task_id)
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
    task_ids: List[int] = Query(...),  
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Batch request for task_ids: {task_ids}") 
    return await get_tasks_batch_service(db, task_ids)

@router.get("/{task_id}", response_model=dict)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_task_service(db, task_id)