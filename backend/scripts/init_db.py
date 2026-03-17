import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


from app.models import (
    User, Session, PasswordReset,
    Contest, Contest_Status, Contest_Role, Contest_User,
    Task, Difficulty_Level, Task_Category, Contest_Task,
    Solution, Solution_State, Prog_Language,
    Sandbox, Sandbox_Verdict
)

from app.database import init_db

async def main():
    print("Создаём таблицы...")
    await init_db()
    print("16 таблиц созданы.")

if __name__ == "__main__":
    asyncio.run(main())