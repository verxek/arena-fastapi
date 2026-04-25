from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.solution import Solution
from backend.app.worker.tasks import run_solution
from backend.app.dependencies.auth import get_current_user
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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
    # 1. создать решение
    solution = Solution(
        sol_task=task_id,
        sol_user=user.user_id,
        sol_prog_lang=language_id,
        sol_state=1  # Pending
    )

    db.add(solution)
    await db.commit()
    await db.refresh(solution)

    # 2. сохранить файл
    sol_dir = os.path.join(UPLOAD_DIR, str(task_id), "solutions")
    os.makedirs(sol_dir, exist_ok=True)

    ext = file.filename.split(".")[-1]
    file_path = os.path.join(sol_dir, f"{solution.solution_id}.{ext}")

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # 3. отправить в celery
    run_solution.delay(solution.solution_id)

    return {"solution_id": solution.solution_id}


@router.get("/my")
async def get_my_solutions(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Solution)
        .where(Solution.sol_user == user_id)
        .order_by(Solution.sol_created_at.desc())
    )
    
    solutions = result.scalars().all()
    

    return [
        {
            "id": s.solution_id,
            "task": s.task_name,
            "language": s.language_name,
            "status": s.state_rel.state_name if s.state_rel else "Pending",
            "time": s.sol_created_at.isoformat()
        }
        for s in solutions
    ]