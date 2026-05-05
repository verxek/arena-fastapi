from sqlalchemy import select
from backend.app.models.task import Task
from .base import BaseRepository
from sqlalchemy.ext.asyncio import AsyncSession



async def get_tasks_by_role(db: AsyncSession, current_user, include_hidden: bool = False) -> list[Task]:
    stmt = select(Task)

    if current_user.role != "organizer":
        stmt = stmt.where(Task.visibility == True)
    else:
        if not include_hidden:
            stmt = stmt.where(
                (Task.visibility == True) |
                (Task.author == current_user.user_id)
            )

    result = await db.execute(stmt)
    return result.scalars().all()

async def get_task_by_name(db: AsyncSession, task_name: str) -> Task | None:
    result = await db.execute(
        select(Task).where(Task.task_name == task_name)
    )
    return result.scalar_one_or_none()


async def create_task(db: AsyncSession, task_data: dict) -> Task:
    new_task = Task(**task_data)
    db.add(new_task)
    await db.flush()
    return new_task


async def update_task_status(db: AsyncSession, task: Task, status: str):
    task.status = status
    await db.commit()