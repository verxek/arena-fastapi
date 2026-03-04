from sqlalchemy import select
from backend.app.models.user import User
from .base import BaseRepository


class UserRepository(BaseRepository):

    async def get_all(self):
        result = await self.session.execute(select(User))
        return result.scalars().all()

    async def get_by_id(self, user_id: int):
        result = await self.session.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str):
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_nickname(self, nickname: str):
        result = await self.session.execute(
            select(User).where(User.nickname == nickname)
        )
        return result.scalar_one_or_none()

    async def create(self, **kwargs):
        user = User(**kwargs)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def delete(self, user: User):
        await self.session.delete(user)
        await self.session.commit()