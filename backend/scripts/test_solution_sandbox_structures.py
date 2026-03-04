# backend/scripts/test_solution_and_sandbox.py
import asyncio
import sys
from pathlib import Path
from datetime import datetime

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.database import engine
from sqlalchemy import text


async def get_or_create_test_data():
    """Получает или создаёт необходимые справочные данные."""
    async with engine.begin() as conn:
        # Пользователь
        result = await conn.execute(text("SELECT user_id FROM \"user\" LIMIT 1"))
        user_id = result.scalar()
        if not user_id:
            raise Exception("Нет пользователей в таблице user")

        # Задача
        result = await conn.execute(text("SELECT task_id FROM task LIMIT 1"))
        task_id = result.scalar()
        if not task_id:
            raise Exception("Нет задач в таблице task")

        # Язык программирования
        result = await conn.execute(text("SELECT proglang_id FROM prog_language LIMIT 1"))
        lang_id = result.scalar()
        if not lang_id:
            raise Exception("Нет языков программирования в prog_language")

        # Состояние решения
        result = await conn.execute(text("SELECT solution_state_id FROM solution_state WHERE state_name = 'In Queue'"))
        state_id = result.scalar()
        if not state_id:
            # Используем первое состояние
            result = await conn.execute(text("SELECT solution_state_id FROM solution_state LIMIT 1"))
            state_id = result.scalar()

        # Вердикт песочницы
        result = await conn.execute(text("SELECT verdict_id FROM sandbox_verdict WHERE verdict_name = 'Accepted'"))
        verdict_id = result.scalar()
        if not verdict_id:
            result = await conn.execute(text("SELECT verdict_id FROM sandbox_verdict LIMIT 1"))
            verdict_id = result.scalar()

        return user_id, task_id, lang_id, state_id, verdict_id


async def test_submit_solution():
    """Тест отправки решения."""
    user_id, task_id, lang_id, state_id, _ = await get_or_create_test_data()

    async with engine.begin() as conn:
        await conn.execute(
            text("CALL submit_solution(:task, :user, :lang, :state)"),
            {
                "task": task_id,
                "user": user_id,
                "lang": lang_id,
                "state": state_id
            }
        )

        # Проверяем, что решение создано
        result = await conn.execute(
            text("SELECT * FROM solution WHERE sol_task = :task AND sol_user = :user ORDER BY sol_created_at DESC LIMIT 1"),
            {"task": task_id, "user": user_id}
        )
        sol = result.fetchone()
        assert sol is not None, "Решение не создано"
        print("Решение успешно отправлено")


async def test_update_solution_state():
    """Тест обновления состояния решения."""
    user_id, task_id, _, _, _ = await get_or_create_test_data()

    async with engine.begin() as conn:
        # Получаем ID последнего решения
        result = await conn.execute(
            text("SELECT solution_id FROM solution WHERE sol_task = :task AND sol_user = :user ORDER BY sol_created_at DESC LIMIT 1"),
            {"task": task_id, "user": user_id}
        )
        sol_id = result.scalar()
        assert sol_id is not None, "Нет решений для обновления"

        # Меняем состояние
        new_state = (await conn.execute(text("SELECT solution_state_id FROM solution_state WHERE state_name != 'In Queue' LIMIT 1"))).scalar()
        if not new_state:
            new_state = (await conn.execute(text("SELECT solution_state_id FROM solution_state LIMIT 1 OFFSET 1"))).scalar()

        await conn.execute(
            text("CALL update_solution_state(:sol_id, :new_state)"),
            {"sol_id": sol_id, "new_state": new_state}
        )

        # Проверяем
        result = await conn.execute(
            text("SELECT sol_state FROM solution WHERE solution_id = :sol_id"),
            {"sol_id": sol_id}
        )
        updated_state = result.scalar()
        assert updated_state == new_state, f"Ожидалось состояние {new_state}, получено {updated_state}"
        print("Состояние решения успешно обновлено")


async def test_contest_solutions_view():
    """Тест представления contest_solutions."""
    user_id, task_id, _, _, _ = await get_or_create_test_data()

    async with engine.begin() as conn:
        # Убеждаемся, что задача входит в хотя бы один контест
        result = await conn.execute(
            text("SELECT ct.contest_ct FROM contest_task ct WHERE ct.task_ct = :task LIMIT 1"),
            {"task": task_id}
        )
        contest_id = result.scalar()
        if not contest_id:
            # Добавляем задачу в контест
            contest_id = (await conn.execute(text("SELECT contest_id FROM contest LIMIT 1"))).scalar()
            if not contest_id:
                raise Exception("Нет контестов")
            await conn.execute(
                text("INSERT INTO contest_task (contest_ct, task_ct) VALUES (:cid, :tid) ON CONFLICT DO NOTHING"),
                {"cid": contest_id, "tid": task_id}
            )

        # Проверяем представление
        result = await conn.execute(
            text("SELECT * FROM contest_solutions WHERE contest_id = :cid AND task_id = :tid"),
            {"cid": contest_id, "tid": task_id}
        )
        rows = result.fetchall()
        assert len(rows) > 0, "Решения не отображаются в contest_solutions"
        print("Представление contest_solutions работает корректно")


async def test_record_sandbox_result():
    """Тест записи результата песочницы."""
    user_id, task_id, _, _, verdict_id = await get_or_create_test_data()

    async with engine.begin() as conn:
        # Получаем ID решения
        result = await conn.execute(
            text("SELECT solution_id FROM solution WHERE sol_task = :task AND sol_user = :user ORDER BY sol_created_at DESC LIMIT 1"),
            {"task": task_id, "user": user_id}
        )
        sol_id = result.scalar()
        assert sol_id is not None, "Нет решений для песочницы"

        # Записываем результат
        await conn.execute(
            text("""
                CALL record_sandbox_result(
                    :sol_id, :verdict, 'Sample output', '00:00:01.25', 128.5
                )
            """),
            {"sol_id": sol_id, "verdict": verdict_id}
        )

        # Проверяем
        result = await conn.execute(
            text("SELECT * FROM sandbox WHERE sandbox_sol = :sol_id"),
            {"sol_id": sol_id}
        )
        sandbox = result.fetchone()
        assert sandbox is not None, "Результат песочницы не записан"
        print("Результат песочницы успешно записан")


async def test_sandbox_results_view():
    """Тест представления sandbox_results_with_details."""
    user_id, task_id, _, _, _ = await get_or_create_test_data()

    async with engine.begin() as conn:
        result = await conn.execute(
            text("SELECT * FROM sandbox_results_with_details WHERE task_id = :task"),
            {"task": task_id}
        )
        rows = result.fetchall()
        assert len(rows) > 0, "Результаты песочницы не отображаются в представлении"
        print("Представление sandbox_results_with_details работает корректно")


async def cleanup_test_data():
    """Очистка тестовых данных (осторожно: удаляет последние решения и sandbox-записи)."""
    async with engine.begin() as conn:
        # Удаляем sandbox-записи по последним решениям
        await conn.execute(text("""
            DELETE FROM sandbox 
            WHERE sandbox_sol IN (
                SELECT solution_id FROM solution 
                ORDER BY sol_created_at DESC 
                LIMIT 5
            )
        """))
        # Удаляем последние решения
        await conn.execute(text("""
            DELETE FROM solution 
            WHERE solution_id IN (
                SELECT solution_id FROM solution 
                ORDER BY sol_created_at DESC 
                LIMIT 5
            )
        """))
        print("Тестовые данные очищены")


async def main():
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ SOLUTION И SANDBOX")
    print("=" * 60)

    try:
        await test_submit_solution()
        await test_update_solution_state()
        await test_contest_solutions_view()
        await test_record_sandbox_result()
        await test_sandbox_results_view()

        print("\n" + "=" * 60)
        print("ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
        print("=" * 60)
    finally:
        await cleanup_test_data()


if __name__ == "__main__":
    asyncio.run(main())