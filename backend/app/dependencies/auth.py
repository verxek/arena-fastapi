from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from backend.app.core.security import decode_token
from backend.app.repositories.user import UserRepository
from backend.app.database import get_db
from backend.app.models.user import User

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = decode_token(token)
        user_id = int(payload.get("sub"))
        role = payload.get("role")
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user

def require_role(required_role: str):

    async def role_checker(
        user: User = Depends(get_current_user)
    ):
        if user.role.value != required_role:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
        return user

    return role_checker

def require_admin():
    return require_role("admin")