import asyncio
from pathlib import Path
import sys

# Настройка путей
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# Импорты
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import select

# Импортируем модель и настройки
# Убедитесь, что путь к config правильный и там есть DATABASE_URL
try:
    from backend.app.core.config import settings
    DATABASE_URL = settings.DATABASE_URL
except ImportError:
    # Запасной вариант, если конфиг лежит иначе
    import os
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:123qwe@localhost:5432/code_arena")

from backend.app.models.user import User, UserRole
from backend.app.core.security import hash_password

async def create_admin():
    # 1. Явно создаем движок (Engine)
    # echo=True покажет SQL-запросы в консоли, полезно для отладки
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # 2. Явно создаем фабрику сессий, привязанную к этому движку
    # Обратите внимание: мы создаем локальную переменную SessionMaker
    LocalSessionMaker = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    session = None
    try:
        # 3. Создаем сессию через фабрику (одни скобки!)
        async with LocalSessionMaker() as session:
            print("Подключение к БД успешно. Проверка пользователя...")
            
            # Проверка на существование
            stmt = select(User).where(User.nickname == "admin")
            result = await session.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                print("⚠️ Пользователь 'admin' уже существует!")
                return

            # Создание пользователя
            user = User(
                nickname="admin",
                email="admin@example.com",  # ЗАМЕНИТЕ на реальный email!
                password_hash=hash_password("admin123"),
                role=UserRole.organizer     # Убедитесь, что такая роль есть в Enum
            )

            session.add(user)
            await session.commit()
            print("✅ Администратор успешно создан!")

    except Exception as e:
        print(f"❌ Произошла ошибка: {e}")
        # Откат только если сессия была успешно создана
        if session:
            try:
                await session.rollback()
                print("🔄 Транзакция откатана.")
            except Exception as rollback_err:
                print(f"Ошибка при откате: {rollback_err}")
    finally:
        # Закрываем соединения двигателя
        await engine.dispose()
        print("🔌 Соединение с БД закрыто.")

if __name__ == "__main__":
    asyncio.run(create_admin())