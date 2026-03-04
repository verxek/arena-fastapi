from fastapi import APIRouter, Depends
from backend.app.dependencies.auth import require_role  
from backend.app.models.user import User

router = APIRouter(prefix="/test", tags=["Test Roles"])


@router.get("/participant")
async def only_participant(
    user: User = Depends(require_role("participant"))
):
    return {"message": f"Hello participant {user.nickname}"}


@router.get("/organizer")
async def only_organizer(
    user: User = Depends(require_role("organizer"))
):
    return {"message": f"Hello organizer {user.nickname}"}


@router.get("/admin")
async def only_admin(
    user: User = Depends(require_role("admin"))
):
    return {"message": f"Hello admin {user.nickname}"}