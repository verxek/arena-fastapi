from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import selectinload
from backend.app.database import get_db
from backend.app.models.solution import Solution
from backend.app.dependencies.auth import get_current_user
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

@router.get("/{solution_id}/status")
async def get_solution_status(
    solution_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Возвращает текущий статус проверки решения для polling"""
    
    # Подгружаем решение с связями
    stmt = select(Solution).where(
        Solution.solution_id == solution_id
    ).options(
        selectinload(Solution.state_rel),
        selectinload(Solution.sandbox_rel)
    )
    result = await db.execute(stmt)
    solution = result.scalar_one_or_none()
    
    # Проверка прав доступа
    if not solution or solution.sol_user != current_user.user_id:
        raise HTTPException(status_code=404, detail="Solution not found")

    state_name = solution.state_rel.state_name if solution.state_rel else "Pending"
    
    # Базовый ответ
    response = {
        "solution_id": solution.solution_id,
        "status": state_name,  
    }
    
    # Если статус финальный — добавляем детали из Sandbox
    FINAL_STATUSES = [
        "Accepted", "Wrong Answer", "Time Limit Exceeded",
        "Memory Limit Exceeded", "Runtime Error", "Compilation Error"
    ]
    
    if state_name in FINAL_STATUSES and solution.sandbox_rel:
        first_test = solution.sandbox_rel[0]
        response.update({
            "verdict": state_name,
            "execution_time_ms": first_test.execution_time_ms,
            "memory_used_kb": first_test.memory_used_kb,
        })
    
    return response
