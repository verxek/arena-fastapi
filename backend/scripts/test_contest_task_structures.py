# backend/scripts/test_contest_task_structures.py
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.database import engine
from sqlalchemy import text


async def get_or_create_test_data():
    """Получает или создаёт тестовые данные."""
    async with engine.begin() as conn:
        # Пользователь
        result = await conn.execute(
            text("SELECT user_id FROM \"user\" WHERE nickname = 'test_author'")
        )
        user_id = result.scalar()
        if not user_id:
            await conn.execute(
                text("CALL register_user('test_author', 'hashed_pwd', 'author@test.com')")
            )
            result = await conn.execute(
                text("SELECT user_id FROM \"user\" WHERE nickname = 'test_author'")
            )
            user_id = result.scalar()

        # Уровень сложности
        result = await conn.execute(
            text("SELECT difficulty_id FROM difficulty_level WHERE diff_name = 'Легкий'")
        )
        difficulty_id = result.scalar()
        if not difficulty_id:
            raise Exception("Требуется хотя бы один уровень сложности в таблице difficulty_level")

        # Категория
        result = await conn.execute(
            text("SELECT category_id FROM task_category WHERE category_name = 'Арифметика'")
        )
        category_id = result.scalar()
        if not category_id:
            raise Exception("Требуется хотя бы одна категория в таблице task_category")

        # Задача
        result = await conn.execute(
            text("SELECT task_id FROM task WHERE task_name = 'Тестовая задача'")
        )
        task_id = result.scalar()
        if not task_id:
            await conn.execute(
                text("""
                    INSERT INTO task (
                        task_name, statement, author, difficulty, category, 
                        time_limit, memory_limit, visibility, created_at
                    ) VALUES (
                        'Тестовая задача', 'Решите задачу', :author, :difficulty, :category,
                        2000, 256, TRUE, NOW()
                    )
                """),
                {
                    "author": user_id,
                    "difficulty": difficulty_id,
                    "category": category_id
                }
            )
            result = await conn.execute(
                text("SELECT task_id FROM task WHERE task_name = 'Тестовая задача'")
            )
            task_id = result.scalar()

        # Контест
        result = await conn.execute(
            text("SELECT contest_id FROM contest WHERE contest_name = 'Тестовый контест'")
        )
        contest_id = result.scalar()
        if not contest_id:
            start_time = datetime.utcnow().replace(tzinfo=None) + timedelta(hours=1)
            duration = timedelta(hours=2)
            await conn.execute(
                text("""
                    CALL create_contest(:name, :start_time, :duration, :status)
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

        return contest_id, task_id, user_id


async def test_add_task_to_contest():
    """Тест добавления задачи в контест через процедуру."""
    contest_id, task_id, _ = await get_or_create_test_data()

    async with engine.begin() as conn:
        await conn.execute(
            text("CALL add_task_to_contest(:cid, :tid)"),
            {"cid": contest_id, "tid": task_id}
        )

        # Проверяем, что связь создана
        result = await conn.execute(
            text("SELECT * FROM contest_task WHERE contest_ct = :cid AND task_ct = :tid"),
            {"cid": contest_id, "tid": task_id}
        )
        assert result.fetchone() is not None, "Задача не добавлена в контест"
        print("Задача успешно добавлена в контест")


async def test_duplicate_prevention():
    """Тест защиты от дубликатов."""
    contest_id, task_id, _ = await get_or_create_test_data()

    async with engine.begin() as conn:
        try:
            await conn.execute(
                text("CALL add_task_to_contest(:cid, :tid)"),
                {"cid": contest_id, "tid": task_id}
            )
            assert False, "Ожидалась ошибка при добавлении дубликата"
        except Exception as e:
            assert "уже добавлена" in str(e), f"Неожиданная ошибка: {e}"
            print("Дубликат успешно заблокирован")


async def test_remove_task_from_contest():
    """Тест удаления задачи из контеста."""
    contest_id, task_id, _ = await get_or_create_test_data()

    async with engine.begin() as conn:
        # Удаляем
        await conn.execute(
            text("CALL remove_task_from_contest(:cid, :tid)"),
            {"cid": contest_id, "tid": task_id}
        )

        # Проверяем, что связи больше нет
        result = await conn.execute(
            text("SELECT * FROM contest_task WHERE contest_ct = :cid AND task_ct = :tid"),
            {"cid": contest_id, "tid": task_id}
        )
        assert result.fetchone() is None, "Задача всё ещё в контесте"
        print("Задача успешно удалена из контеста")


async def test_view_contest_tasks_with_details():
    """Тест представления с деталями задач."""
    contest_id, task_id, _ = await get_or_create_test_data()

    # Сначала добавим задачу
    async with engine.begin() as conn:
        await conn.execute(
            text("CALL add_task_to_contest(:cid, :tid)"),
            {"cid": contest_id, "tid": task_id}
        )

    # Теперь проверим представление
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT * FROM contest_tasks_with_details WHERE contest_id = :cid"),
            {"cid": contest_id}
        )
        row = result.fetchone()
        assert row is not None, "Задача не найдена в представлении"
        assert row.task_id == task_id, "Неверный ID задачи"
        assert row.difficulty == "Легкий", "Неверный уровень сложности"
        print("Представление contest_tasks_with_details работает корректно")


async def test_view_contest_task_statistics():
    """Тест представления статистики по задачам."""
    contest_id, task_id, _ = await get_or_create_test_data()

    # Добавим задачу
    async with engine.begin() as conn:
        await conn.execute(
            text("CALL add_task_to_contest(:cid, :tid)"),
            {"cid": contest_id, "tid": task_id}
        )

    # Проверим статистику
    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT * FROM contest_task_statistics WHERE contest_id = :cid"),
            {"cid": contest_id}
        )
        row = result.fetchone()
        assert row is not None, "Статистика не найдена"
        assert row.task_id == task_id, "Неверный ID задачи в статистике"
        print("Представление contest_task_statistics работает корректно")


async def cleanup_test_data():
    """Очистка тестовых данных."""
    async with engine.begin() as conn:
        await conn.execute(text("DELETE FROM contest_task"))
        await conn.execute(text("DELETE FROM contest WHERE contest_name = 'Тестовый контест'"))
        await conn.execute(text("DELETE FROM task WHERE task_name = 'Тестовая задача'"))
        await conn.execute(text("DELETE FROM \"user\" WHERE nickname = 'test_author'"))
        print("Тестовые данные очищены")


async def main():
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ СТРУКТУР ТАБЛИЦЫ CONTEST_TASK")
    print("=" * 60)

    try:
        await test_add_task_to_contest()
        await test_duplicate_prevention()
        await test_remove_task_from_contest()
        await test_view_contest_tasks_with_details()
        await test_view_contest_task_statistics()

        print("\n" + "=" * 60)
        print("ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print("=" * 60)
    finally:
        await cleanup_test_data()


if __name__ == "__main__":
    asyncio.run(main())