from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import UserCreate
from backend.app.dependencies.auth import get_current_user
from backend.app.dependencies.auth import require_role

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/users")
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # проверка email
    existing = await db.execute(
        select(User).where(User.email == user.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email уже существует")

    # проверка nickname
    existing_nick = await db.execute(
        select(User).where(User.nickname == user.nickname)
    )
    if existing_nick.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Nickname уже существует")

    new_user = User(
        email=user.email,
        nickname=user.nickname,
        password_hash=pwd_context.hash(user.password),
        role=user.role
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {"message": "User created", "id": new_user.user_id}

@router.get("/users")
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    result = await db.execute(select(User))
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

@router.patch("/users/{user_id}/role")
async def change_role(
    user_id: int,
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(404, "User not found")

    user.role = role
    await db.commit()

    return {"message": "Role updated"}