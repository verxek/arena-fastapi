from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from backend.app.core.security import decode_token
from backend.app.repositories.user import UserRepository
from backend.app.database import get_db
from backend.app.models.user import User
from typing import Optional

security = HTTPBearer()

async def get_current_user(
    request: Request,
    session = Depends(get_db)
) -> Optional[User]:
    
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None  
    
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        return None

    try:
        payload = decode_token(token)  
        user_id = int(payload.get("sub"))
        # role = payload.get("role") 
    except (JWTError, ValueError, AttributeError, TypeError):
        return None  
    try:
        user_repo = UserRepository(session)
        user = await user_repo.get_by_id(user_id)
        return user if user else None 
    except Exception:
        return None   # гость (для публичных эндпоинтов)

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