from pydantic import BaseModel
from datetime import datetime, time


class ContestBase(BaseModel):
    contest_name: str
    start_time: datetime
    duration: time
    contest_status: int


class ContestCreate(ContestBase):
    pass


class ContestUpdate(BaseModel):
    contest_name: str | None = None
    start_time: datetime | None = None
    duration: time | None = None
    contest_status: int | None = None


class ContestListResponse(BaseModel):
    contest_id: int
    contest_name: str
    start_time: datetime
    duration: time

    class Config:
        from_attributes = True


class ContestDetailResponse(ContestBase):
    contest_id: int
    contest_created_at: datetime

    class Config:
        from_attributes = True