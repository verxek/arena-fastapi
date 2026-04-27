from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta, time, timezone, tzinfo
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.contest import Contest
from backend.app.models.contest_user import Contest_User
from backend.app.models.user import User
from backend.app.schemas.contest import ContestCreate, ContestListResponse, ContestUpdate
from backend.app.dependencies.auth import get_current_user
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession 
from backend.app.models.user import User
from backend.app.services.contest_service import create_contest_service, build_contest_response, delete_contest_service, get_contest_service, update_contest_service, register_to_contest_service

router = APIRouter(prefix="/contests", tags=["contests"])

UTC_PLUS_5 = timezone(timedelta(hours=5))
ORGANIZER_ROLE_ID = 2

def to_local(dt):
    if dt is None:
        return None
    return dt.astimezone(UTC_PLUS_5)

@router.post("/", status_code=201)
async def create_contest(
    contest_data: ContestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        contest = await create_contest_service(db, contest_data, current_user)

        return {
            "message": "Contest created successfully",
            "contest_id": contest.contest_id
        }

    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/", response_model=List[ContestListResponse])
async def get_contests(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Contest).options(
        joinedload(Contest.participants).joinedload(Contest_User.role_rel)
    )

    result = await db.execute(stmt)
    contests = result.scalars().unique().all()

    return [
        build_contest_response(contest, current_user)
        for contest in contests
    ]

@router.delete("/{contest_id}")
async def delete_contest(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    await delete_contest_service(db, contest_id, current_user)

    return {
        "message": "Контест удалён",
        "contest_id": contest_id
    }

@router.get("/{contest_id}")
async def get_contest(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    return await get_contest_service(db, contest_id, current_user)


@router.put("/{contest_id}")
async def update_contest(
    contest_id: int,
    contest_data: ContestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await update_contest_service(db, contest_id, contest_data, current_user)

    return {
        "message": "Контест обновлён",
        "contest_id": contest_id
    }
    
@router.post("/{contest_id}/register")
async def register_to_contest(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await register_to_contest_service(db, contest_id, current_user)

    return {"status": "registered"}