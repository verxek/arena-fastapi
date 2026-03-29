from fastapi import APIRouter, Depends
from backend.app.dependencies.auth import get_current_user
from backend.app.schemas.user import UserResponse
from backend.app.models import User
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession 
from backend.app.database import get_db
from backend.app.models.contest_user import Contest_User
from sqlalchemy.orm import selectinload
from backend.app.models.task import Task
from backend.app.models.solution import Solution

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await db.refresh(current_user, attribute_names=[
        'authored_tasks', 
        'contest_participations', 
        'solutions'
    ])

    return current_user