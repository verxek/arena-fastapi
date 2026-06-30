from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.database import get_db
from backend.app.models.user import User, UserRole
from backend.app.schemas.user import UserCreate
from backend.app.dependencies.auth import require_role
from backend.app.services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/users")
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    service = AdminService(db)
    return await service.create_user(user)

@router.get("/users")
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    service = AdminService(db)
    return await service.get_all_users()

@router.patch("/users/{user_id}/role")
async def change_role(
    user_id: int,
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin"))
):
    service = AdminService(db)
    return await service.change_role(user_id, role)