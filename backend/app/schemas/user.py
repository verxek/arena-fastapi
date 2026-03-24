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

    class Config:
        from_attributes = True