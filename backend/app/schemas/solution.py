from pydantic import BaseModel
from datetime import datetime


class SolutionCreate(BaseModel):
    sol_task: int
    sol_prog_lang: int
    code: str


class SolutionResponse(BaseModel):
    solution_id: int
    sol_task: int
    sol_user: int
    sol_state: int
    sol_created_at: datetime

    class Config:
        from_attributes = True