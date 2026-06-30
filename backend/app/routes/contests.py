from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import  timedelta,timezone
from typing import List, Optional
from backend.app.database import get_db
from backend.app.schemas.contest import ContestCreate, ContestListResponse, ContestUpdate
from backend.app.dependencies.auth import get_current_user
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession 
from backend.app.models import Contest, Contest_User, Contest_Task, Solution, User
from backend.app.services.contest_service import create_contest_service, build_contest_response, delete_contest_service, get_contest_service, update_contest_service, register_to_contest_service
from backend.app.services.scoring import calculate_contest_rating
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/contests", tags=["contests"])

UTC_PLUS_5 = timezone(timedelta(hours=5))
ORGANIZER_ROLE_ID = 2

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
    current_user: Optional[User] = Depends(get_current_user)  
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


@router.get("/{contest_id}/rating")
async def get_contest_rating(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
  
    contest = await db.get(Contest, contest_id)
    if not contest:
        raise HTTPException(status_code=404, detail="Контест не найден")

    tasks_stmt = select(Contest_Task).where(
        Contest_Task.contest_ct == contest_id
    ).options(selectinload(Contest_Task.task_rel)).order_by(Contest_Task.task_contest_id)
    
    ct_records = (await db.execute(tasks_stmt)).scalars().all()
    tasks_ordered = [ct.task_rel for ct in ct_records if ct.task_rel]
    task_ids = [t.task_id for t in tasks_ordered]

   
    participants_stmt = select(Contest_User).where(
        Contest_User.cu_contest == contest_id,
        Contest_User.role == 1
    ).options(selectinload(Contest_User.user_rel))
    
    participants_records = (await db.execute(participants_stmt)).scalars().all()
    participants = [p.user_rel for p in participants_records if p.user_rel]

    solutions_stmt = select(Solution).where(
        Solution.sol_task.in_(task_ids),
        Solution.sol_user.in_([u.user_id for u in participants])
    ).options(selectinload(Solution.state_rel))
    
    solutions = (await db.execute(solutions_stmt)).scalars().all()

    rating = calculate_contest_rating(
        contest=contest,
        participants=participants,
        solutions=solutions,
        tasks_ordered=tasks_ordered  
    )

    return rating
