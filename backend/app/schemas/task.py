from pydantic import BaseModel
from datetime import datetime


class TaskBase(BaseModel):
    task_name: str
    statement: str
    difficulty: int
    category: int
    time_limit: int
    memory_limit: int
    visibility: bool = True


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    task_name: str | None = None
    statement: str | None = None
    visibility: bool | None = None


class TaskListResponse(BaseModel):
    task_id: int
    task_name: str
    difficulty: int
    category: int

    class Config:
        from_attributes = True


class TaskDetailResponse(TaskBase):
    task_id: int
    created_at: datetime
    author: int | None

    class Config:
        from_attributes = True