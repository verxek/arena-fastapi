import os
from backend.app.models.solution import Solution
from backend.app.worker.tasks import run_solution
from sqlalchemy import select
from backend.app.models.contest_task import Contest_Task 
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

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
            .options(
                selectinload(Solution.state_rel),  
                selectinload(Solution.task_rel),
                selectinload(Solution.language_rel)
            )
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
    
    async def get_contest_solutions(self, contest_id: int):
        try:
            print(f" get_contest_solutions: contest_id={contest_id}")
            
           
            contest_task_ids_query = select(Contest_Task.task_ct).where(
                Contest_Task.contest_ct == contest_id
            )
            task_ids_result = await self.session.execute(contest_task_ids_query)
            task_ids = task_ids_result.scalars().all()
            print(f"Task IDs in contest {contest_id}: {task_ids}")
            
            if not task_ids:
                return []
            
            stmt = (
                select(Solution)
                .where(Solution.sol_task.in_(task_ids))
                .options(
                    selectinload(Solution.task_rel),        
                    selectinload(Solution.user_rel),       
                    selectinload(Solution.language_rel),  
                    selectinload(Solution.state_rel),    
                    selectinload(Solution.sandbox_rel),     
                )
                .order_by(Solution.sol_created_at.desc())
            )
            
            result = await self.session.execute(stmt)
            solutions = result.scalars().all()
            
            print(f"Found {len(solutions)} solutions")
          
            return [
                {
                    "id": s.solution_id,
                    "task": s.task_name,
                    "user": s.user_nickname,
                    "language": s.language_name,
                    "status": s.state_rel.state_name if s.state_rel else "Pending",
                    "time": s.sol_created_at.isoformat(),
        
                }
                for s in solutions
            ]
            
        except Exception as e:
            print(f"ERROR in get_contest_solutions: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            raise
    