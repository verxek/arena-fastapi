from sqlalchemy import select
from datetime import datetime, timezone
from backend.app.models.contest import Contest
from .base import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.models.contest_task import Contest_Task


async def get_contest_by_id(contest_id: int, db: AsyncSession) -> Contest | None:
    return await db.get(Contest, contest_id)


async def get_contest_tasks_with_task(contest_id: int, db: AsyncSession) -> list[Contest_Task]:
    result = await db.execute(
        select(Contest_Task)
        .where(Contest_Task.contest_ct == contest_id)
        .options(selectinload(Contest_Task.task_rel))
    )
    return result.scalars().all()


async def save_and_commit(db: AsyncSession):
    await db.commit()