from sqlalchemy import select
from app.models.solution import Solution
from .base import BaseRepository


class SolutionRepository(BaseRepository):

    async def get_by_id(self, solution_id: int):
        result = await self.session.execute(
            select(Solution).where(
                Solution.solution_id == solution_id
            )
        )
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int):
        result = await self.session.execute(
            select(Solution).where(
                Solution.sol_user == user_id
            )
        )
        return result.scalars().all()

    async def create(self, **kwargs):
        solution = Solution(**kwargs)
        self.session.add(solution)
        await self.session.commit()
        await self.session.refresh(solution)
        return solution

    async def update_state(self, solution: Solution, state: str):
        solution.sol_state = state
        await self.session.commit()
        await self.session.refresh(solution)
        return solution