from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.models.contest import Contest
from backend.app.models.contest_task import Contest_Task


async def finish_contest(contest_id: int, db: AsyncSession):

    # 1. сам контест
    contest = await db.get(Contest, contest_id)
    if not contest:
        return

    if contest.contest_status == 4:
        return

    # 2. задачи контеста
    result = await db.execute(
        select(Contest_Task)
        .where(Contest_Task.contest_ct == contest_id)
        .options(selectinload(Contest_Task.task_rel))
    )
    links = result.scalars().all()

    # 3. обработка задач
    for ct in links:
        task = ct.task_rel
        if not task:
            continue

        if task.make_visible_after_contest:
            task.visibility = True

    # 4. закрываем контест
    contest.contest_status = 4

    # 5. сохраняем
    await db.commit()