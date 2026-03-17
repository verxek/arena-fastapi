from pydantic import BaseModel
from datetime import datetime, time
from typing import List, Optional

class ContestBase(BaseModel):
    contest_name: str
    start_time: datetime
    duration: time
    contest_status: int

class ContestCreate(ContestBase):
    task_ids: List[int] = []

class ContestUpdate(BaseModel):
    contest_name: Optional[str] = None
    start_time: Optional[datetime] = None
    duration: Optional[time] = None
    contest_status: Optional[int] = None

class ContestListResponse(BaseModel):
    contest_id: int
    contest_name: str
    start_time: datetime
    duration: time
    contest_status: int  
    is_upcoming: bool = False
    is_active: bool = False
    is_finished: bool = False
    total_participants: int = 0
    contest_duration_str: str = ""
    author_id: Optional[int] = None
    is_participant: bool = False

    class Config:
        from_attributes = True

class ContestDetailResponse(ContestBase):
    contest_id: int
    contest_created_at: datetime
    creator_id: int

    class Config:
        from_attributes = True