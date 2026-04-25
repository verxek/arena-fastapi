from backend.app.models import User
from backend.app.schemas.user import UserResponse

def build_user_response(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        nickname=user.nickname,
        email=user.email,
        role=user.role,
        registration_date=user.registration_date,

        authored_tasks_count=user.authored_tasks_count,

        solved_tasks_count=user.solved_tasks_count,

        organized_contests_count=user.organized_contests_count,

        participated_contests_count=user.participated_contests_count
    )