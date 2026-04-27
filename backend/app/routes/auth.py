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
from backend.app.services.verification_service import VerificationService
from backend.app.schemas.auth import SendCodeRequest, VerifyCodeRequest

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
async def refresh_token(
    refresh_token: str,
    session = Depends(get_db)
):
    service = AuthService(session)

    return await service.refresh(refresh_token)

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




@router.post("/register/send-code")
async def send_code(request: SendCodeRequest, db=Depends(get_db)):
    service = VerificationService(db)
    return await service.send_code(request.email)

@router.post("/register/verify-code")
async def verify_code(request: VerifyCodeRequest, db=Depends(get_db)):
    service = VerificationService(db)
    return await service.verify_code(request.email, request.code)

@router.post("/register")
async def register(user_data: UserCreate, session=Depends(get_db)):
    service = AuthService(session)

    try:
        return await service.register(
            nickname=user_data.nickname,
            email=user_data.email,
            password=user_data.password
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))