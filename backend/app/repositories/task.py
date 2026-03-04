from sqlalchemy import select
from app.models.task import Task
from .base import BaseRepository


class TaskRepository(BaseRepository):

    async def get_by_id(self, task_id: int):
        result = await self.session.execute(
            select(Task).where(Task.task_id == task_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self):
        result = await self.session.execute(select(Task))
        return result.scalars().all()

    async def create(self, **kwargs):
        task = Task(**kwargs)
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def delete(self, task: Task):
        await self.session.delete(task)
        await self.session.commit()