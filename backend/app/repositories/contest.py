from sqlalchemy import select
from datetime import datetime, timezone
from backend.app.models.contest import Contest
from .base import BaseRepository


class ContestRepository(BaseRepository):

    async def get_by_id(self, contest_id: int):
        result = await self.session.execute(
            select(Contest).where(Contest.contest_id == contest_id)
        )
        return result.scalar_one_or_none()

    async def get_active(self):
        now = datetime.now(timezone.utc)

        result = await self.session.execute(
            select(Contest).where(
                Contest.start_time <= now,
                (Contest.start_time + Contest.duration) >= now
            )
        )

        return result.scalars().all()

    async def get_upcoming(self):
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(Contest).where(
                Contest.start_time > now
            )
        )
        return result.scalars().all()

    async def create(self, **kwargs):
        contest = Contest(**kwargs)
        self.session.add(contest)
        await self.session.commit()
        await self.session.refresh(contest)
        return contest

    async def delete(self, contest: Contest):
        await self.session.delete(contest)
        await self.session.commit()