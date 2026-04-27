import os
from backend.app.models.solution import Solution
from backend.app.worker.tasks import run_solution
from sqlalchemy import select

UPLOAD_DIR = "uploads/tasks"


class SolutionService:

    def __init__(self, session):
        self.session = session

    async def submit_solution(self, task_id: int, language_id: int, file, user_id: int):

        # 1. create solution
        solution = Solution(
            sol_task=task_id,
            sol_user=user_id,
            sol_prog_lang=language_id,
            sol_state=1  # Pending
        )

        self.session.add(solution)
        await self.session.commit()
        await self.session.refresh(solution)

        # 2. save file
        sol_dir = os.path.join(UPLOAD_DIR, str(task_id), "solutions")
        os.makedirs(sol_dir, exist_ok=True)

        ext = file.filename.split(".")[-1]
        file_path = os.path.join(sol_dir, f"{solution.solution_id}.{ext}")

        content = await file.read()

        with open(file_path, "wb") as f:
            f.write(content)

        # 3. async judge
        run_solution.delay(solution.solution_id)

        return {"solution_id": solution.solution_id}
    
    async def get_my_solutions(self, user_id: int):

        result = await self.session.execute(
            select(Solution)
            .where(Solution.sol_user == user_id)
            .order_by(Solution.sol_created_at.desc())
        )

        solutions = result.scalars().all()

        return [
            {
                "id": s.solution_id,
                "task": s.task_name,
                "language": s.language_name,
                "status": s.state_rel.state_name if s.state_rel else "Pending",
                "time": s.sol_created_at.isoformat()
            }
            for s in solutions
        ]