from backend.app.models import User
from backend.app.schemas.user import UserResponse

def build_user_response(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        nickname=user.nickname,
        email=user.email,
        role=user.role,
        registration_date=user.registration_date,

        authored_tasks_count=len(user.authored_tasks or []),

        solved_tasks_count=len(user.solutions or []),

        organized_contests_count=sum(
            1 for p in user.contest_participations
            if p.role == 2
        ) if user.contest_participations else 0,

        participated_contests_count=0  # пока убери сложную логику
    )