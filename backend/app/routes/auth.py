from fastapi import APIRouter, Depends, HTTPException
from backend.app.schemas.user import UserCreate, UserResponse
from backend.app.schemas.auth import UserLogin
from backend.app.services.auth import AuthService
from backend.app.database import get_db
from sqlalchemy.exc import IntegrityError

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
        token = await service.login(
            nickname=user_data.nickname,
            password=user_data.password
        )
        return {"access_token": token}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))