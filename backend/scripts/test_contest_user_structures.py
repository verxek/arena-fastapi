# backend/scripts/test_contest_user_structures.py
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.database import engine
from sqlalchemy import text


async def get_or_create_test_user(nickname: str) -> int:
    """Получает или создаёт тестового пользователя."""
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT user_id FROM \"user\" WHERE nickname = :nickname"),
            {"nickname": nickname}
        )
        user_id = result.scalar()
        if not user_id:
            await conn.execute(
                text("CALL register_user(:nickname, 'hashed_pwd', :email)"),
                {"nickname": nickname, "email": f"{nickname}@test.com"}
            )
            result = await conn.execute(
                text("SELECT user_id FROM \"user\" WHERE nickname = :nickname"),
                {"nickname": nickname}
            )
            user_id = result.scalar()
        return user_id


async def get_or_create_test_contest() -> int:
    """Получает или создаёт тестовый контест."""
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT contest_id FROM contest WHERE contest_name = 'Тестовый контест'")
        )
        contest_id = result.scalar()
        if not contest_id:
            start_time = datetime.utcnow().replace(tzinfo=None) + timedelta(hours=1)
            duration = timedelta(hours=2)
            await conn.execute(
                text("""
                    CALL create_contest(
                        :name, :start_time, :duration, :status
                    )
                """),
                {
                    "name": "Тестовый контест",
                    "start_time": start_time,
                    "duration": duration,
                    "status": 1  # Draft
                }
            )
            result = await conn.execute(
                text("SELECT contest_id FROM contest WHERE contest_name = 'Тестовый контест'")
            )
            contest_id = result.scalar()
        return contest_id


async def get_role_id(role_name: str) -> int:
    """Получает ID роли по её названию."""
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT role_id FROM contest_role WHERE role_name = :role_name"),
            {"role_name": role_name}
        )
        return result.scalar()


async def test_add_participant():
    """Тест добавления участника с ролью по умолчанию."""
    user_id = await get_or_create_test_user("test_user")
    contest_id = await get_or_create_test_contest()

    async with engine.begin() as conn:
        await conn.execute(
            text("CALL add_user_to_contest(:user_id, :contest_id)"),
            {"user_id": user_id, "contest_id": contest_id}
        )

        result = await conn.execute(
            text("""
                SELECT role FROM contest_participants_with_details 
                WHERE user_id = :user_id AND contest_id = :contest_id
            """),
            {"user_id": user_id, "contest_id": contest_id}
        )
        participant = result.fetchone()
        assert participant is not None, "Участник не найден"
        assert participant.role == "Участник", f"Ожидалась роль 'Участник', получена '{participant.role}'"
        print("Участник успешно добавлен")


async def test_add_organizer():
    """Тест добавления организатора."""
    organizer_id = await get_or_create_test_user("test_organizer")
    contest_id = await get_or_create_test_contest()
    organizer_role_id = await get_role_id("Организатор")

    async with engine.begin() as conn:
        await conn.execute(
            text("CALL add_user_to_contest(:user_id, :contest_id, :role_id)"),
            {"user_id": organizer_id, "contest_id": contest_id, "role_id": organizer_role_id}
        )

        result = await conn.execute(
            text("""
                SELECT role FROM contest_participants_with_details 
                WHERE user_id = :user_id AND contest_id = :contest_id
            """),
            {"user_id": organizer_id, "contest_id": contest_id}
        )
        organizer = result.fetchone()
        assert organizer is not None, "Организатор не найден"
        assert organizer.role == "Организатор", f"Ожидалась роль 'Организатор', получена '{organizer.role}'"
        print("Организатор успешно добавлен")


async def test_duplicate_prevention():
    """Тест защиты от дубликатов."""
    user_id = await get_or_create_test_user("test_user")
    contest_id = await get_or_create_test_contest()

    async with engine.begin() as conn:
        try:
            await conn.execute(
                text("CALL add_user_to_contest(:user_id, :contest_id)"),
                {"user_id": user_id, "contest_id": contest_id}
            )
            assert False, "Ожидалось исключение при добавлении дубликата"
        except Exception as e:
            assert "уже зарегистрирован" in str(e), f"Неожиданная ошибка: {e}"
            print("Дубликат успешно заблокирован")


async def test_participant_stats():
    """Тест представления статистики участников."""
    contest_id = await get_or_create_test_contest()

    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT * FROM contest_participant_stats WHERE contest_id = :contest_id"),
            {"contest_id": contest_id}
        )
        stats = result.fetchone()
        assert stats is not None, "Статистика не найдена"
        assert stats.total_participants == 2, f"Ожидалось 2 участника, получено {stats.total_participants}"
        assert stats.organizers == 1, f"Ожидался 1 организатор, получено {stats.organizers}"
        assert stats.participants == 1, f"Ожидался 1 участник, получено {stats.participants}"
        print("Статистика участников корректна")


async def test_remove_participant():
    """Тест удаления участника."""
    user_id = await get_or_create_test_user("test_user")
    contest_id = await get_or_create_test_contest()

    async with engine.begin() as conn:
        # Удаляем участника
        await conn.execute(
            text("CALL remove_user_from_contest(:user_id, :contest_id)"),
            {"user_id": user_id, "contest_id": contest_id}
        )

        # Проверяем, что участника больше нет
        result = await conn.execute(
            text("""
                SELECT COUNT(*) FROM contest_participants_with_details 
                WHERE user_id = :user_id AND contest_id = :contest_id
            """),
            {"user_id": user_id, "contest_id": contest_id}
        )
        count = result.scalar()
        assert count == 0, "Участник всё ещё присутствует после удаления"
        print("Участник успешно удалён")


async def test_remove_nonexistent():
    """Тест удаления несуществующего участника."""
    contest_id = await get_or_create_test_contest()

    async with engine.begin() as conn:
        await conn.execute(
            text("CALL remove_user_from_contest(:user_id, :contest_id)"),
            {"user_id": 999999, "contest_id": contest_id}
        )
        print("Удаление несуществующего участника прошло без ошибок")


async def cleanup_test_data():
    """Очистка тестовых данных."""
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM contest_user WHERE cu_contest IN (SELECT contest_id FROM contest WHERE contest_name = 'Тестовый контест')"))
        await conn.execute(text("DELETE FROM contest WHERE contest_name = 'Тестовый контест'"))
        await conn.execute(text("DELETE FROM \"user\" WHERE nickname IN ('test_user', 'test_organizer')"))
        print("Тестовые данные очищены")


async def main():
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ СТРУКТУР ТАБЛИЦЫ CONTEST_USER")
    print("=" * 60)

    try:
        await test_add_participant()
        await test_add_organizer()
        await test_duplicate_prevention()
        await test_participant_stats()
        await test_remove_participant()
        await test_remove_nonexistent()
        
        print("\n" + "=" * 60)
        print("ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print("=" * 60)
    finally:
        await cleanup_test_data()


if __name__ == "__main__":
    asyncio.run(main())