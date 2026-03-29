from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta, time
from typing import List
from backend.app.database import get_db
from backend.app.models.contest import Contest
from backend.app.models.contest_task import Contest_Task
from backend.app.models.contest_user import Contest_User
from backend.app.models.user import User
from backend.app.schemas.contest import ContestCreate, ContestListResponse
from backend.app.dependencies.auth import get_current_user
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession 

router = APIRouter(prefix="/contests", tags=["contests"])

ORGANIZER_ROLE_ID = 2

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_contest(
    contest_data: ContestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Создает новый контест, привязывает задачи и регистрирует создателя как Организатора.
    Асинхронная версия.
    """

    try:
        duration_input = contest_data.duration

        if isinstance(duration_input, time):
            duration_delta = timedelta(hours=duration_input.hour, minutes=duration_input.minute)
        elif isinstance(duration_input, int):
            duration_delta = timedelta(minutes=duration_input)
        else:
            duration_delta = timedelta(minutes=int(duration_input))

        new_contest = Contest(
            contest_name=contest_data.contest_name,
            start_time=contest_data.start_time,
            duration=duration_delta,  
            contest_status=contest_data.contest_status
        )
        db.add(new_contest)
    
        await db.flush() # чтоб сразу получить id

        for task_id in contest_data.task_ids:
            link = Contest_Task(
                task_ct=task_id,
                contest_ct=new_contest.contest_id
            )
            db.add(link)

        participation = Contest_User(
            cu_user=current_user.user_id,
            cu_contest=new_contest.contest_id,
            role=ORGANIZER_ROLE_ID 
        )
        db.add(participation)

        await db.commit()
        
        await db.refresh(new_contest)

        return {
            "message": "Contest created successfully", 
            "contest_id": new_contest.contest_id,
            "status": "created"
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create contest: {str(e)}")

@router.get("/", response_model=List[ContestListResponse])
async def get_contests(
    db: AsyncSession = Depends(get_db),  
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает список всех контестов с вычисляемыми полями.

    """
    stmt = select(Contest).options(
        joinedload(Contest.participants).joinedload(Contest_User.role_rel)
    )
    
    result = await db.execute(stmt)
    
    contests = result.scalars().unique().all()  
    
    response_list = []
    
    for contest in contests:
        is_upcoming = contest.is_upcoming()
        is_active = contest.is_active()
        is_finished = contest.is_finished()
        
        duration_str = contest.contest_duration_str
        total_participants = contest.total_participants
        
        author_id = None
        is_current_user_participant = False
        is_current_user_organizer = False  
        
        for participant in contest.participants:
            if participant.is_organizer:
                if author_id is None:  
                    author_id = participant.cu_user
            
            if participant.cu_user == current_user.user_id:
                is_current_user_participant = True
                if participant.is_organizer:
                    is_current_user_organizer = True

        contest_dict = {
            "contest_id": contest.contest_id,
            "contest_name": contest.contest_name,
            "start_time": contest.start_time,
            "duration": contest.duration,
            "contest_status": contest.contest_status,
            "is_upcoming": is_upcoming,
            "is_active": is_active,
            "is_finished": is_finished,
            "contest_duration_str": duration_str,
            "total_participants": total_participants,
            "author_id": author_id,
            "is_participant": is_current_user_participant,
            "is_organizer": is_current_user_organizer 
        }
        response_list.append(contest_dict)

    return response_list