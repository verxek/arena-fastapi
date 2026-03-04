from backend.app.repositories.user import UserRepository
from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from backend.app.models.user import UserRole


class AuthService:

    def __init__(self, session):
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
            role=UserRole.participant  # по умолчанию
        )

        return user

    async def login(self, nickname: str, password: str):
        user = await self.user_repo.get_by_nickname(nickname)
        if not user:
            raise ValueError("Invalid credentials")

        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid credentials")

        token = create_access_token(
            data={
                "sub": str(user.user_id),
                "role": user.role.value
            }
        )

        return token