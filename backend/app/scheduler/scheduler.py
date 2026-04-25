from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from backend.app.database import AsyncSessionLocal, now_utc
from backend.app.models.contest import Contest
from backend.app.services.contest_service import finish_contest


scheduler = AsyncIOScheduler()


async def check_contests():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Contest))
        contests = result.scalars().all()

        now = now_utc()

        for contest in contests:
            if contest.contest_status == 4:
                continue

            end_time = contest.get_end_time()

            if end_time <= now:
                await finish_contest(contest.contest_id, db)


def start_scheduler():
    scheduler.add_job(check_contests, "interval", minutes=1)
    scheduler.start()