from passlib.context import CryptContext
from sqlalchemy import select
from fastapi import HTTPException

from backend.app.models.user import User


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AdminService:

    def __init__(self, session):
        self.session = session

    async def create_user(self, user):

        # email check
        existing = await self.session.execute(
            select(User).where(User.email == user.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(400, "Email уже существует")

        # nickname check
        existing_nick = await self.session.execute(
            select(User).where(User.nickname == user.nickname)
        )
        if existing_nick.scalar_one_or_none():
            raise HTTPException(400, "Nickname уже существует")

        new_user = User(
            email=user.email,
            nickname=user.nickname,
            password_hash=pwd_context.hash(user.password),
            role=user.role
        )

        self.session.add(new_user)
        await self.session.commit()
        await self.session.refresh(new_user)

        return {
            "message": "User created",
            "id": new_user.user_id
        }
    
    async def get_all_users(self):

        result = await self.session.execute(select(User))
        users = result.scalars().all()

        return [
            {
                "id": u.user_id,
                "email": u.email,
                "nickname": u.nickname,
                "role": u.role.value
            }
            for u in users
        ]
    
    async def change_role(self, user_id: int, role):

        result = await self.session.execute(
            select(User).where(User.user_id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(404, "User not found")

        user.role = role
        await self.session.commit()

        return {"message": "Role updated"}