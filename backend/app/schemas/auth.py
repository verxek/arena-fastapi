from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserLogin(BaseModel):
    nickname: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SessionResponse(BaseModel):
    session_id: str
    expires_at: datetime