from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.user import UserCreate, UserResponse
from backend.app.schemas.auth import UserLogin
from backend.app.services.auth import AuthService
from backend.app.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.app.core.security import (
    create_access_token,
    decode_token
)
from jose import JWTError
from backend.app.models import RefreshToken
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from backend.app.models.user import User
from backend.app.models.user import UserRole
from pydantic import BaseModel, EmailStr
import random
import string

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, session = Depends(get_db)):
    service = AuthService(session)

    try:
        return await service.register(
            nickname=user_data.nickname,
            email=user_data.email,
            password=user_data.password
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Nickname or email already exists"
        )


@router.post("/login")
async def login(user_data: UserLogin, session = Depends(get_db)):
    service = AuthService(session)

    try:
        tokens = await service.login(
            nickname=user_data.nickname,
            password=user_data.password
        )
        return tokens
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/refresh")
async def refresh_token(refresh_token: str, session = Depends(get_db)):

    try:
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=401,
                detail="Invalid token type"
            )

        token_db = await session.execute(
            select(RefreshToken).where(RefreshToken.token == refresh_token)
        )

        token_obj = token_db.scalar_one_or_none()

        # токен не найден
        if not token_obj:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token"
            )

        # проверка срока действия
        if token_obj.expires_at < datetime.now(timezone.utc):
            raise HTTPException(
                status_code=401,
                detail="Refresh token expired"
            )

        user_id = payload.get("sub")

        new_access_token = create_access_token({
            "sub": user_id
        })

        return {
            "access_token": new_access_token
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(refresh_token: str, session = Depends(get_db)):

    result = await session.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token)
    )

    token = result.scalar_one_or_none()

    if token:
        await session.delete(token)
        await session.commit()

    return {"message": "Logged out"}


verification_codes = {}

class SendCodeRequest(BaseModel):
    email: EmailStr

class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str

class RegisterRequest(BaseModel):
    email: EmailStr
    nickname: str
    password: str

def generate_code() -> str:
    """Генерирует 6-значный код"""
    return ''.join(random.choices(string.digits, k=6))

@router.post("/register/send-code")
async def send_registration_code(request: SendCodeRequest, db: Session = Depends(get_db)):
    
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")
    
    code = generate_code()
    
    verification_codes[request.email] = {
        "code": code,
        "created_at": datetime.utcnow(),
        "attempts": 0
    }
    
    # TODO: Отправка email через SMTP
    print(f"Код подтверждения для {request.email}: {code}")
    
    # В продакшене:
    # await send_email(
    #     to=request.email,
    #     subject="Подтверждение регистрации",
    #     body=f"Ваш код: {code}"
    # )
    
    return {"message": "Код отправлен на email"}

@router.post("/register/verify-code")
async def verify_registration_code(request: VerifyCodeRequest, db: Session = Depends(get_db)):

    if request.email not in verification_codes:
        raise HTTPException(status_code=400, detail="Код не отправлен или истёк")
    
    stored = verification_codes[request.email]
    
    if stored["attempts"] >= 3:
        del verification_codes[request.email]
        raise HTTPException(status_code=400, detail="Слишком много попыток. Запросите код заново")
    

    if stored["code"] != request.code:
        stored["attempts"] += 1
        raise HTTPException(status_code=400, detail="Неверный код")
    
    if datetime.utcnow() - stored["created_at"] > timedelta(minutes=10):
        del verification_codes[request.email]
        raise HTTPException(status_code=400, detail="Код истёк. Запросите новый")
    
    del verification_codes[request.email]
    
    return {"message": "Email подтверждён"}

@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    stmt = select(User).where(User.email == request.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="Email уже занят")

    stmt = select(User).where(User.nickname == request.nickname)
    result = await db.execute(stmt)
    existing_nickname = result.scalar_one_or_none()

    if existing_nickname:
        raise HTTPException(status_code=400, detail="Никнейм уже занят")
    
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hashed_password = pwd_context.hash(request.password)
    
    new_user = User(
        email=request.email,
        nickname=request.nickname,
        password_hash=hashed_password,
        role=UserRole.participant,  
        registration_date=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Регистрация успешна",
        "user_id": new_user.user_id,
        "role": new_user.role.value
    }