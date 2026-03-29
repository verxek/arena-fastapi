from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    nickname: str = Field(..., min_length=4, max_length=30,
                          description="User nickname")
    email: EmailStr
    


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    user_id: int
    registration_date: datetime
    nickname: str
    email: str
    role: str

    authored_tasks_count: int = 0
    organized_contests_count: int = 0
    solved_tasks_count: int = 0
    participated_contests_count: int = 0

    class Config:
        from_attributes = True