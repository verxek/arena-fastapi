from fastapi import APIRouter, Depends
from backend.app.dependencies.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_me(user = Depends(get_current_user)):
    return {
        "id": user.user_id,
        "nickname": user.nickname,
        "role": user.role
    }