from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta, time, timezone, tzinfo
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.contest import Contest
from backend.app.models.contest_task import Contest_Task
from backend.app.models.contest_user import Contest_User
from backend.app.models.user import User
from backend.app.schemas.contest import ContestCreate, ContestListResponse, ContestResponse
from backend.app.dependencies.auth import get_current_user
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession 
from backend.app.models.user import User
from backend.app.database import now_utc

from sqlalchemy.orm import selectinload

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
        if contest_data.contest_status != 1: 
            if not contest_data.contest_name or not contest_data.start_time or not contest_data.task_ids:
                raise HTTPException(
                    status_code=400,
                    detail="Для публикации заполните все поля"
                )

        duration_input = contest_data.duration or time(0,0)

        if isinstance(duration_input, time):
            duration_delta = timedelta(hours=duration_input.hour, minutes=duration_input.minute)
        elif isinstance(duration_input, int):
            duration_delta = timedelta(minutes=duration_input)
        else:
            duration_delta = timedelta(minutes=int(duration_input))


        start_time = contest_data.start_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=timezone.utc)

        new_contest = Contest(
            contest_name=contest_data.contest_name,
            start_time=start_time,
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
        print("now:", now_utc(), now_utc().tzinfo)
        print("start:", contest.start_time, contest.start_time.tzinfo)
        is_upcoming = contest.is_upcoming
        is_active = contest.is_active
        is_finished = contest.is_finished
        
        duration_str = contest.contest_duration_str
        total_participants = contest.total_participants
        
        author = contest.organizer.cu_user if contest.organizer else None 
        
        

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
            "author_id": author,
            "is_organizer": current_user is not None and current_user.user_id == author,
            "is_participant": (
                current_user.role != "organizer"
                and any(p.cu_user == current_user.user_id for p in contest.participants)
            )
       
        }
        response_list.append(contest_dict)

    return response_list


@router.get("/drafts")
async def get_drafts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Возвращает черновики текущего пользователя-организатора.
    Черновик = contest_status == 1
    """
    
    if current_user.role != "organizer":
        raise HTTPException(status_code=403, detail="Доступно только организаторам")
    

    stmt = select(Contest).where(
        Contest.contest_status == 1,  
        Contest.get_contest_author == current_user.user_id
    ).options(
        joinedload(Contest.tasks),
        joinedload(Contest.participants)
    )
    
    result = await db.execute(stmt)
    contests = result.scalars().unique().all()

    response_list = []
    for contest in contests:
        response_list.append({
            "contest_id": contest.contest_id,
            "contest_name": contest.contest_name,
            "start_time": contest.start_time,
            "duration": contest.contest_duration_str,
            "contest_status": contest.contest_status,
            "tasks": [t.task_id for t in contest.tasks],
            "total_tasks": len(contest.tasks),
            "contest_created_at": contest.contest_created_at
        })
    
    return response_list


@router.post("/{contest_id}/publish")
async def publish_contest(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Публикует черновик (меняет статус с 1 на 2 = запланирован).
    """
    
    if current_user.role != "organizer":
        raise HTTPException(status_code=403, detail="Доступно только организаторам")
    contest = await db.get(Contest, contest_id)
    if not contest:
        raise HTTPException(status_code=404, detail="Контест не найден")
    
    if contest.get_contest_author != current_user.user_id:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    
    if contest.contest_status != 1:
        raise HTTPException(status_code=400, detail="Этот контест уже опубликован")
    
    if not contest.start_time:
        raise HTTPException(status_code=400, detail="Укажите дату начала контеста")
    
    if not contest.duration:
        raise HTTPException(status_code=400, detail="Укажите длительность контеста")
    
    contest.contest_status = 2
    
    await db.commit()
    await db.refresh(contest)
    
    return {
        "message": "Контест опубликован",
        "contest_id": contest.contest_id,
        "new_status": contest.contest_status
    }

@router.delete("/{contest_id}")
async def delete_contest(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Удаляет черновик контеста.
    """
    
    if current_user.role != "organizer":
        raise HTTPException(status_code=403, detail="Доступно только организаторам")

    contest = await db.get(Contest, contest_id)
    if not contest:
        raise HTTPException(status_code=404, detail="Контест не найден")
    
    if contest.get_contest_author != current_user.user_id:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    
    await db.delete(contest)
    await db.commit()
    
    return {"message": "Черновик удалён", "contest_id": contest_id}

@router.get("/{contest_id}")
async def get_contest(
    contest_id: int,
    db: AsyncSession = Depends(get_db),  
    current_user: Optional[User] = Depends(get_current_user)
):
    result = await db.execute(
        select(Contest).where(Contest.contest_id == contest_id)
    )
    contest = result.scalar_one_or_none()
    
    if not contest:
        raise HTTPException(status_code=404, detail="Contest not found")
    
  
    def to_iso(dt):
        """Конвертирует datetime в ISO-строку"""
        if dt is None:
            return None
        if hasattr(dt, 'isoformat'):
            return dt.isoformat()
        return str(dt)
    
    tasks_list = [
        t.task_rel.task_id 
        for t in contest.tasks 
        if hasattr(t, 'task_rel') and t.task_rel is not None
    ]
    
    author = contest.organizer.cu_user if contest.organizer else None
    is_author = current_user.user_id == author
    is_participant = any(
        p.cu_user == current_user.user_id
        for p in contest.participants
    )

    return {
        "contest_id": contest.contest_id,
        "contest_name": contest.contest_name,
        "start_time": to_iso(contest.start_time),
        "end_time": to_iso(contest.get_end_time()),
        "contest_status": contest.contest_status,

        "is_finished": contest.is_finished,
        "is_active": contest.is_active,
        "is_upcoming": contest.is_upcoming,

        "total_participants": contest.total_participants,
        "contest_duration_str": contest.contest_duration_str,

        "author_id": author,
        "is_author": is_author,
        "is_participant": is_participant,
       

        "task_list": tasks_list
    }   


@router.put("/{contest_id}")
async def update_contest(
    contest_id: int,
    contest_data: ContestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Обновляет существующий контест
    """

    contest = await db.get(Contest, contest_id)

    if not contest:
        raise HTTPException(status_code=404, detail="Контест не найден")

    # проверка прав
    author = contest.organizers[0].cu_user
    
    if author is None:
        raise HTTPException(400, detail="У контеста нет автора")

    if author != current_user.user_id:
        raise HTTPException(403, detail="Доступ запрещён")
    try:
        # --- длительность ---
        duration_input = contest_data.duration

        if isinstance(duration_input, time):
            duration_delta = timedelta(
                hours=duration_input.hour,
                minutes=duration_input.minute
            )
        elif isinstance(duration_input, int):
            duration_delta = timedelta(minutes=duration_input)
        else:
            duration_delta = timedelta(minutes=int(duration_input))


        contest.contest_name = contest_data.contest_name
        contest.start_time = contest_data.start_time
        contest.duration = duration_delta
        contest.contest_status = contest_data.contest_status

        # --- обновляем задачи ---
   
        await db.execute(
            Contest_Task.__table__.delete().where(
                Contest_Task.contest_ct == contest_id
            )
        )

        # добавляем новые
        for task_id in contest_data.task_ids:
            link = Contest_Task(
                task_ct=task_id,
                contest_ct=contest_id
            )
            db.add(link)

        await db.commit()
        await db.refresh(contest)

        return {
            "message": "Контест обновлён",
            "contest_id": contest.contest_id
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления: {str(e)}")
    


@router.post("/{contest_id}/register")
async def register_to_contest(
    contest_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # проверка что уже не зарегистрирован
    result = await db.execute(
        select(Contest_User).where(
            Contest_User.cu_contest == contest_id,
            Contest_User.cu_user == current_user.user_id
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(400, detail="Already registered")

    participation = Contest_User(
        cu_user=current_user.user_id,
        cu_contest=contest_id,
        role=1  # participant
    )

    db.add(participation)
    await db.commit()

    return {"status": "registered"}