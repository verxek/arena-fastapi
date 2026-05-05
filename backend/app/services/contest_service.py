from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.models.contest import Contest
from backend.app.models.contest_task import Contest_Task
from datetime import timezone, timedelta
from backend.app.models.contest_user import Contest_User
from backend.app.database import now_utc
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from backend.app.repositories.contest import (
    get_contest_by_id,
    get_contest_tasks_with_task,
    save_and_commit,
)

from datetime import datetime



UTC_PLUS_5 = timezone(timedelta(hours=5))
ORGANIZER_ROLE_ID = 2

async def finish_contest(contest_id: int, db: AsyncSession):
    contest = await get_contest_by_id(contest_id, db)
    if not contest or contest.contest_status == 4:
        return

    links = await get_contest_tasks_with_task(contest_id, db)

    for ct in links:
        task = ct.task_rel
        if not task:
            continue
        if task.make_visible_after_contest:
            task.visibility = True

    contest.contest_status = 4
    await save_and_commit(db)




async def create_contest_service(db: AsyncSession, contest_data, current_user):
    start_time = contest_data.start_time

    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=UTC_PLUS_5)

    start_time = start_time.astimezone(timezone.utc)

    new_contest = Contest(
        contest_name=contest_data.contest_name,
        start_time=start_time,
        duration=contest_data.duration,
        contest_status=2
    )

    db.add(new_contest)
    await db.flush()

    for task_id in contest_data.task_ids:
        db.add(Contest_Task(
            task_ct=task_id,
            contest_ct=new_contest.contest_id
        ))

    db.add(Contest_User(
        cu_user=current_user.user_id,
        cu_contest=new_contest.contest_id,
        role=ORGANIZER_ROLE_ID
    ))

    await db.commit()
    await db.refresh(new_contest)

    return new_contest

def build_contest_response(contest, current_user):
    now = now_utc()

    start = contest.start_time
    end = contest.get_end_time()

    is_upcoming = now < start
    is_active = start <= now < end
    is_finished = now >= end

    author = contest.organizer.cu_user if contest.organizer else None

    is_participant = False
    if current_user is not None:
        is_participant = any(
            p.cu_user == current_user.user_id
            for p in contest.participants
        )

    is_organizer = False
    if current_user is not None and author is not None:
        is_organizer = current_user.user_id == author

    return {
        "contest_id": contest.contest_id,
        "contest_name": contest.contest_name,
        "start_time": start.isoformat(),
        "duration": contest.duration,
        "contest_status": contest.contest_status,

        "is_upcoming": is_upcoming,
        "is_active": is_active,
        "is_finished": is_finished,

        "contest_duration_str": contest.contest_duration_str,
        "total_participants": contest.total_participants,

        "author_id": author,
        
        "is_organizer": is_organizer,
        "is_participant": is_participant
    }


async def delete_contest_service(db, contest_id: int, current_user):
    if current_user.role != "organizer":
        raise HTTPException(403, "Доступно только организаторам")

    contest = await db.get(Contest, contest_id)
    if not contest:
        raise HTTPException(404, "Контест не найден")

    if contest.get_contest_author != current_user.user_id:
        raise HTTPException(403, "Доступ запрещён")

    await db.delete(contest)
    await db.commit()


async def get_contest_service(db, contest_id: int, current_user):
    result = await db.execute(
        select(Contest).where(Contest.contest_id == contest_id)
    )
    contest = result.scalar_one_or_none()

    if not contest:
        raise HTTPException(404, "Contest not found")

    # задачи
    tasks_list = [
        t.task_rel.task_id
        for t in contest.tasks
        if t.task_rel is not None
    ]

    author = contest.organizer.cu_user if contest.organizer else None

    # время и статусы
    now = now_utc()
    start = contest.start_time
    end = contest.get_end_time()

    # безопасно проверяем current_user
    is_author = current_user and current_user.user_id == author
    is_participant = current_user and any(
        p.cu_user == current_user.user_id
        for p in contest.participants
    )

    return {
        "contest_id": contest.contest_id,
        "contest_name": contest.contest_name,

        "start_time": start.isoformat(),
        "end_time": end.isoformat(),

        "contest_status": contest.contest_status,

        "is_upcoming": now < start,
        "is_active": start <= now < end,
        "is_finished": now >= end,

        "total_participants": contest.total_participants,
        "contest_duration_str": contest.contest_duration_str,

        "author_id": author,
        "is_author": is_author,
        "is_participant": is_participant,

        "task_list": tasks_list
    }


async def update_contest_service(db, contest_id: int, contest_data, current_user):
    contest = await db.get(Contest, contest_id)

    if not contest:
        raise HTTPException(404, "Контест не найден")

    # проверка автора
    author = contest.organizers[0].cu_user

    if author is None:
        raise HTTPException(400, "У контеста нет автора")

    if author != current_user.user_id:
        raise HTTPException(403, "Доступ запрещён")

    try:
        # --- обновление основных полей ---
        contest.contest_name = contest_data.contest_name

        start_time = contest_data.start_time
        if start_time.tzinfo is None:
            start_time = start_time.replace(tzinfo=UTC_PLUS_5)

        contest.start_time = start_time.astimezone(timezone.utc)
        contest.duration = contest_data.duration
        contest.contest_status = 2

        # --- обновление задач ---
        await db.execute(
            Contest_Task.__table__.delete().where(
                Contest_Task.contest_ct == contest_id
            )
        )

        for task_id in contest_data.task_ids:
            db.add(Contest_Task(
                task_ct=task_id,
                contest_ct=contest_id
            ))

        await db.commit()
        await db.refresh(contest)

        return contest

    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"Ошибка обновления: {str(e)}")
    


async def register_to_contest_service(db, contest_id: int, current_user):
    # проверка, что уже не зарегистрирован
    result = await db.execute(
        select(Contest_User).where(
            Contest_User.cu_contest == contest_id,
            Contest_User.cu_user == current_user.user_id
        )
    )

    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(400, "Already registered")

    participation = Contest_User(
        cu_user=current_user.user_id,
        cu_contest=contest_id,
        role=1  # participant
    )

    db.add(participation)
    await db.commit()


