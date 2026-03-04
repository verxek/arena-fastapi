from sqlalchemy import select
from backend.app.models.contest_task import Contest_Task
from .base import BaseRepository


class ContestTaskRepository(BaseRepository):

    async def add_task_to_contest(self, contest_id: int, task_id: int):
        obj = Contest_Task(
            contest_ct=contest_id,
            task_ct=task_id
        )

        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)

        return obj

    async def get_tasks_by_contest(self, contest_id: int):
        result = await self.session.execute(
            select(Contest_Task).where(
                Contest_Task.contest_ct == contest_id
            )
        )
        return result.scalars().all()