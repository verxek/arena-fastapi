# backend/app/schemas/task.py
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional, List

class TaskBase(BaseModel):
    task_name: str = Field(..., min_length=1, max_length=200)
    statement: str
    difficulty_id: int
    category_id: int
    time_limit: int  # мс
    memory_limit: int  # МБ
    visibility: bool = True
    make_visible_after_contest: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    task_name: Optional[str] = None
    statement: Optional[str] = None
    difficulty_id: Optional[int] = None
    category_id: Optional[int] = None
    time_limit: Optional[int] = None
    memory_limit: Optional[int] = None
    visibility: Optional[bool] = None

class TaskResponse(TaskBase):
    task_id: int
    author_id: Optional[int] = None
    created_at: datetime
    visibility: bool
    tests_path: Optional[str] = None
    solution_path: Optional[str] = None

    category_name: Optional[str] = None
    difficulty_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class TaskSimple(BaseModel):
    task_id: int
    task_name: str
    