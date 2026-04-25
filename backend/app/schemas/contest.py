from pydantic import BaseModel, ConfigDict
from datetime import datetime, time, timedelta
from typing import List, Optional
from backend.app.schemas.task import TaskSimple

class ContestBase(BaseModel):
    contest_name: str
    start_time: datetime
    duration: int  
    contest_status: int

class ContestCreate(BaseModel):
    contest_name: str
    start_time: datetime
    duration: int  
    task_ids: List[int] = []

class ContestUpdate(BaseModel):
    contest_name: Optional[str] = None
    start_time: Optional[datetime] = None
    duration: Optional[int] = None
    task_ids: List[int] = []


class ContestListResponse(BaseModel):
    contest_id: int
    contest_name: str
    start_time: datetime
    duration: int
    contest_status: int  
    is_upcoming: bool = False
    is_active: bool = False
    is_finished: bool = False
    total_participants: int = 0
    author_id: Optional[int] = None
    is_participant: bool = False
    is_organizer: bool = False
    contest_duration_str: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            timedelta: lambda v: v.total_seconds() 
        }

class ContestDetailResponse(ContestBase):
    contest_id: int
    contest_created_at: datetime
    creator_id: int

    class Config:
        from_attributes = True


class ContestResponse(BaseModel):
    contest_id: int
    contest_name: str
    start_time: datetime
    end_time: datetime
    contest_status: int
    is_finished: bool
    is_active: bool
    is_upcoming: bool
    total_participants: int
    contest_duration_str: str
    author_id: Optional[int]
    is_organizer: bool
    task_list: Optional[List[TaskSimple]] = []
    
    model_config = ConfigDict(from_attributes=True)