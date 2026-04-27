from backend.app.repositories.user import UserRepository
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token
)
from backend.app.models.user import UserRole
from backend.app.models import RefreshToken
from datetime import datetime, timedelta, timezone
from backend.app.core.security import (
    create_access_token,
    decode_token
)
from jose import JWTError
from backend.app.models import RefreshToken
from sqlalchemy import select


class AuthService:

    def __init__(self, session):
        self.session = session
        self.user_repo = UserRepository(session)

    async def register(self, nickname: str, email: str, password: str):
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ValueError("Email already registered")\
            
        existing_nickname = await self.user_repo.get_by_nickname(nickname)
        if existing_nickname:
            raise ValueError("Nickname already taken")

        user = await self.user_repo.create(
            nickname=nickname,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.participant  # по умолчанию участник
        )

        return user

    async def login(self, nickname: str, password: str):
        user = await self.user_repo.get_by_nickname(nickname)
        if not user:
            raise ValueError("Invalid credentials")

        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        access_token = create_access_token({
            "sub": str(user.user_id),
            "role": user.role.value
        })

        refresh_token = create_refresh_token({
            "sub": str(user.user_id)
        })

        self.session.add(
            RefreshToken(
                token=refresh_token,
                user_id=user.user_id,
                expires_at=datetime.now(timezone.utc) + timedelta(days=7)
            )
        )
        await self.session.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.user_id,       
            "role": user.role,            
            "nickname": user.nickname      
        }
    
    async def refresh(self, refresh_token: str):
        try:
            payload = decode_token(refresh_token)

            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")

            result = await self.session.execute(
                select(RefreshToken).where(RefreshToken.token == refresh_token)
            )

            token_obj = result.scalar_one_or_none()

            if not token_obj:
                raise ValueError("Invalid refresh token")

            if token_obj.expires_at < datetime.now(timezone.utc):
                raise ValueError("Refresh token expired")

            user_id = payload.get("sub")

            new_access_token = create_access_token({
                "sub": user_id
            })

            return {
                "access_token": new_access_token
            }

        except JWTError:
            raise ValueError("Invalid refresh token")
        
    async def register(self, nickname: str, email: str, password: str):

        existing_email = await self.user_repo.get_by_email(email)
        if existing_email:
            raise ValueError("Email already registered")

        existing_nickname = await self.user_repo.get_by_nickname(nickname)
        if existing_nickname:
            raise ValueError("Nickname already taken")

        user = await self.user_repo.create(
            nickname=nickname,
            email=email,
            password_hash=hash_password(password),
            role=UserRole.participant,
            registration_date=datetime.utcnow()
        )

        return {
            "message": "Регистрация успешна",
            "user_id": user.user_id,
            "role": user.role.value
        }