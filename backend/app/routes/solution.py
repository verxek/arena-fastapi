from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.solution import Solution
from backend.app.worker.tasks import run_solution
from backend.app.dependencies.auth import get_current_user
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.services.solution_service import SolutionService
from backend.app.models.user import User

router = APIRouter()

UPLOAD_DIR = "uploads/tasks"


@router.post("/submit")
async def submit_solution(
    task_id: int = Form(...),
    language_id: int = Form(...),
    file: UploadFile = File(...),
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = SolutionService(db)

    return await service.submit_solution(
        task_id,
        language_id,
        file,
        user.user_id
    )


@router.get("/my")
async def get_my_solutions(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    service = SolutionService(db)

    return await service.get_my_solutions(user.user_id)

@router.get("/contests/{contest_id}/solutions")
async def get_contest_solutions(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)  # только для авторизованных
):
    service = SolutionService(db)
    solutions = await service.get_contest_solutions(contest_id)
    return solutions