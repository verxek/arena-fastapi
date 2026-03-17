from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.user import UserCreate, UserResponse
from backend.app.schemas.auth import UserLogin
from backend.app.services.auth import AuthService
from backend.app.database import get_db
from sqlalchemy.exc import IntegrityError
from backend.app.core.security import (
    create_access_token,
    decode_token
)
from jose import JWTError
from backend.app.models import RefreshToken
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

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