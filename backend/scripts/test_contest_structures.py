# backend/scripts/test_contest_structures.py
import asyncio
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
from backend.app.database import now_utc


# Добавляем корень проекта в sys.path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.database import engine
from sqlalchemy import text


async def test_contest_structures():
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ СТРУКТУР ТАБЛИЦЫ CONTEST")
    print("=" * 60)
    
    async with engine.begin() as conn:
        try:
            # === 0. Получаем ID справочных данных ===
            print("\nПолучение ID справочных данных...")
            
            # Получаем ID статусов
            result = await conn.execute(text("SELECT contest_status_id FROM contest_status WHERE status_name = 'Draft'"))
            draft_status_id = result.scalar()
            
            result = await conn.execute(text("SELECT contest_status_id FROM contest_status WHERE status_name = 'Upcoming'"))
            upcoming_status_id = result.scalar()
            
            result = await conn.execute(text("SELECT contest_status_id FROM contest_status WHERE status_name = 'Active'"))
            active_status_id = result.scalar()
            
            result = await conn.execute(text("SELECT contest_status_id FROM contest_status WHERE status_name = 'Finished'"))
            finished_status_id = result.scalar()
            
            result = await conn.execute(text("SELECT contest_status_id FROM contest_status WHERE status_name = 'Cancelled'"))
            cancelled_status_id = result.scalar()
            
            print(f"Draft ID: {draft_status_id}")
            print(f"Upcoming ID: {upcoming_status_id}")
            print(f"Active ID: {active_status_id}")
            print(f"Finished ID: {finished_status_id}")
            print(f"Cancelled ID: {cancelled_status_id}")

            # === 1. Тест создания контеста ===
            start_time = now_utc() + timedelta(hours=1)

           
            start_time_naive = start_time.replace(tzinfo=None)

            await conn.execute(
            text("""
                CALL create_contest(
                    :name, :start_time, :duration, :status
                )
            """),
                {
                    "name": "Тестовый контест",
                    "start_time": start_time_naive,  
                    "duration": timedelta(hours=2),
                    "status": draft_status_id
                }
            )

            # Получаем ID созданного контеста
            result = await conn.execute(
                text("SELECT contest_id FROM contest WHERE contest_name = 'Тестовый контест'")
            )
            contest_id = result.scalar()
            print(f"ID контеста: {contest_id}")

            # === 2. Тест обновления контеста ===
            print("\nТест обновления контеста...")
           
            start_time = now_utc() + timedelta(hours=2)
            # Убираем временную зону, если она есть
            if start_time.tzinfo is not None:
                start_time = start_time.replace(tzinfo=None)

            # Передаём в процедуру
            await conn.execute(
                text("CALL update_contest(:contest_id, :name, :start_time, :duration)"),
                {
                    "contest_id": contest_id,
                    "name": "Обновлённый тестовый контест",
                    "start_time": start_time,  
                    "duration": timedelta(hours=3)
                }
            )
            print("Контест успешно обновлён")

            # Проверяем обновление
            result = await conn.execute(
                text("SELECT contest_name, start_time, duration FROM contest WHERE contest_id = :contest_id"),
                {"contest_id": contest_id}
            )
            updated_contest = result.fetchone()
            print(f"   Новое название: {updated_contest.contest_name}")
            print(f"   Новое время начала: {updated_contest.start_time}")
            print(f"   Новая продолжительность: {updated_contest.duration}")

            # === 3. Тест изменения статуса (Draft → Upcoming) ===
            print("\nТест изменения статуса (Draft → Upcoming)...")
            await conn.execute(
                text("CALL change_contest_status(:contest_id, :new_status)"),
                {"contest_id": contest_id, "new_status": upcoming_status_id}
            )
            print("Статус изменён на Upcoming")

            # Проверяем статус
            result = await conn.execute(
                text("SELECT contest_status FROM contest WHERE contest_id = :contest_id"),
                {"contest_id": contest_id}
            )
            current_status = result.scalar()
            print(f"   Текущий статус ID: {current_status}")

            # === 4. Тест изменения статуса (Upcoming → Active) ===
            print("\nТест изменения статуса (Upcoming → Active)...")
            await conn.execute(
                text("CALL change_contest_status(:contest_id, :new_status)"),
                {"contest_id": contest_id, "new_status": active_status_id}
            )
            print("Статус изменён на Active")

            # === 5. Тест представления upcoming_and_active_contests ===
            print("\nТест представления upcoming_and_active_contests...")
            result = await conn.execute(text("SELECT * FROM upcoming_and_active_contests WHERE contest_id = :contest_id"), {"contest_id": contest_id})
            active_contest = result.fetchone()
            
            if active_contest:
                print("Контест виден в представлении upcoming_and_active_contests")
                print(f"   Название: {active_contest.contest_name}")
                print(f"   Статус: {active_contest.contest_status}")
                print(f"   Фаза: {active_contest.current_phase}")
            else:
                print("Контест не найден в upcoming_and_active_contests")

            # === 6. Тест представления contest_statistics ===
            print("\nТест представления contest_statistics...")
            result = await conn.execute(text("SELECT * FROM contest_statistics WHERE contest_id = :contest_id"), {"contest_id": contest_id})
            stats = result.fetchone()
            
            if stats:
                print("Статистика контеста получена")
                print(f"   Участники: {stats.participants_count}")
                print(f"   Задачи: {stats.tasks_count}")
                print(f"   Решения: {stats.total_submissions}")
            else:
                print("Статистика не найдена")

            

            # === 8. Тест завершения контеста (Active → Finished) ===
            print("\nТест завершения контеста (Active → Finished)...")
            await conn.execute(
                text("CALL change_contest_status(:contest_id, :new_status)"),
                {"contest_id": contest_id, "new_status": finished_status_id}
            )
            print("Контест успешно завершён")

            # === 9. Тест отмены контеста из Draft ===
            print("\nТест создания и отмены контеста (Draft → Cancelled)...")
            start_time = now_utc() + timedelta(hours=1)
            if start_time.tzinfo is not None:
                start_time = start_time.replace(tzinfo=None)


            await conn.execute(
                text("CALL create_contest(:name, :start_time, :duration, :status)"),
                {
                    "name": "Контест для отмены",
                    "start_time": start_time, 
                    "duration": timedelta(hours=1),
                    "status": 1
                }
            )
            result = await conn.execute(
                text("SELECT contest_id FROM contest WHERE contest_name = 'Контест для отмены'")
            )
            cancel_contest_id = result.scalar()
            
            await conn.execute(
                text("CALL change_contest_status(:contest_id, :new_status)"),
                {"contest_id": cancel_contest_id, "new_status": cancelled_status_id}
            )
            print("Контест успешно отменён")

            # === 10. Тест триггера created_at ===
            print("\nТест триггера contest_created_at...")
            result = await conn.execute(
                text("SELECT contest_created_at FROM contest WHERE contest_id = :contest_id"),
                {"contest_id": contest_id}
            )
            created_at = result.scalar()
            
            if created_at:
                print(f"Триггер contest_created_at работает: {created_at}")
            else:
                print("Поле contest_created_at пустое")

            # === Очистка ===
            print("\nОчистка тестовых данных...")
            await conn.execute(
                text("DELETE FROM contest WHERE contest_name IN ('Обновлённый тестовый контест', 'Контест для отмены')")
            )
            print("Тестовые данные удалены")

            print("\n" + "=" * 60)
            print("ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
            print("=" * 60)

        except Exception as e:
            print(f"\nОШИБКА: {e}")
            print("\nОчистка тестовых данных...")
            try:
                await conn.execute(
                    text("DELETE FROM contest WHERE contest_name LIKE '%тестовый%' OR contest_name LIKE '%отмены%'")
                )
                print("Тестовые данные удалены")
            except Exception as cleanup_error:
                print(f"Ошибка при очистке: {cleanup_error}")
            raise


if __name__ == "__main__":
    asyncio.run(test_contest_structures())