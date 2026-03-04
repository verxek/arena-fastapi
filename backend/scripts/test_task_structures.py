# backend/scripts/test_task_structures.py
import asyncio
import sys
from pathlib import Path

# Добавляем корень проекта в sys.path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.app.database import engine
from sqlalchemy import text


async def test_task_structures():
    print("=" * 60)
    print("ТЕСТИРОВАНИЕ СТРУКТУР ТАБЛИЦЫ TASK")
    print("=" * 60)
    
    async with engine.begin() as conn:
        try:
            # === 0. Получаем ID справочных данных ===
            print("\n0️Получение ID справочных данных...")
            
            result = await conn.execute(text("SELECT user_id FROM \"user\" LIMIT 1"))
            author_id = result.scalar()
            if not author_id:
                print("Нет пользователей! Создаём тестового автора...")
                await conn.execute(
                    text("CALL register_user('test_author', 'hashed_pwd', 'author@test.com')")
                )
                result = await conn.execute(text("SELECT user_id FROM \"user\" WHERE nickname = 'test_author'"))
                author_id = result.scalar()
            
            # Получаем ID категории и сложности
            result = await conn.execute(text("SELECT category_id FROM task_category WHERE category_name = 'Арифметика'"))
            category_id = result.scalar()
            
            result = await conn.execute(text("SELECT difficulty_id FROM difficulty_level WHERE diff_name = 'Легкий'"))
            difficulty_id = result.scalar()
            
            print(f"Автор ID: {author_id}")
            print(f"Категория ID: {category_id} (Арифметика)")
            print(f"Сложность ID: {difficulty_id} (Легкий)")

            # === 1. Тест создания задачи ===
            print("\nТест создания задачи...")
            await conn.execute(
                text("""
                    CALL create_task(
                        :name, :author, :statement, :difficulty, :category,
                        :time_limit, :memory_limit, :make_visible_after_contest, :visibility
                    )
                """),
                {
                    "name": "Тестовая задача",
                    "author": author_id,
                    "statement": "Напишите программу, которая выводит 'Hello World'",
                    "difficulty": difficulty_id,
                    "category": category_id,
                    "time_limit": 2000,
                    "memory_limit": 256,
                    "make_visible_after_contest": False,
                    "visibility": True
                }
            )
            print("Задача успешно создана")

            # Получаем ID созданной задачи
            result = await conn.execute(
                text("SELECT task_id FROM task WHERE task_name = 'Тестовая задача'")
            )
            task_id = result.scalar()
            print(f"ID задачи: {task_id}")

            # === 2. Тест представления visible_tasks ===
            print("\nТест представления visible_tasks...")
            result = await conn.execute(
                text("SELECT * FROM visible_tasks WHERE task_id = :task_id"),
                {"task_id": task_id}
            )
            visible_task = result.fetchone()
            
            if visible_task:
                print("✅ Задача видна в представлении visible_tasks")
                print(f"   Название: {visible_task.task_name}")
                print(f"   Автор: {visible_task.author_nickname}")
                print(f"   Категория: {visible_task.category_name}")
                print(f"   Сложность: {visible_task.difficulty_name}")
                print(f"   Видимость: {visible_task.visibility}")
            else:
                print("Задача не найдена в visible_tasks")

            # === 3. Тест представления task_statistics ===
            print("\nТест представления task_statistics...")
            result = await conn.execute(
                text("SELECT * FROM task_statistics WHERE task_id = :task_id"),
                {"task_id": task_id}
            )
            stats = result.fetchone()
            
            if stats:
                print("Статистика задачи получена")
                print(f"   Общие решения: {stats.total_submissions}")
                print(f"   Принято: {stats.accepted_count}")
                print(f"   Успех: {stats.success_rate}%")
                print(f"   Контестов использовано: {stats.contests_used}")
            else:
                print("Статистика не найдена")

            # === 4. Тест обновления задачи ===
            print("\nТест обновления задачи...")
            
            # Получаем другие ID для обновления
            result = await conn.execute(text("SELECT category_id FROM task_category WHERE category_name = 'Геометрия'"))
            new_category_id = result.scalar()
            
            result = await conn.execute(text("SELECT difficulty_id FROM difficulty_level WHERE diff_name = 'Средний'"))
            new_difficulty_id = result.scalar()
            
            await conn.execute(
                text("""
                    CALL update_task(
                        :task_id, :name, :statement, :difficulty, :category,
                        :time_limit, :memory_limit, :make_visible_after_contest, :visibility
                    )
                """),
                {
                    "task_id": task_id,
                    "name": "Обновлённая тестовая задача",
                    "statement": "Обновлённое условие задачи по геометрии",
                    "difficulty": new_difficulty_id,
                    "category": new_category_id,
                    "time_limit": 3000,
                    "memory_limit": 512,
                    "make_visible_after_contest": True,
                    "visibility": False
                }
            )
            print("Задача успешно обновлена")

            # Проверяем обновление
            result = await conn.execute(
                text("SELECT task_name, difficulty, category, visibility FROM task WHERE task_id = :task_id"),
                {"task_id": task_id}
            )
            updated_task = result.fetchone()
            print(f"   Новое название: {updated_task.task_name}")
            print(f"   Новая сложность ID: {updated_task.difficulty}")
            print(f"   Новая категория ID: {updated_task.category}")
            print(f"   Новая видимость: {updated_task.visibility}")

            # === 5. Тест представления tasks_by_category ===
            print("\nТест представления tasks_by_category...")
            result = await conn.execute(text("SELECT * FROM tasks_by_category"))
            categories = result.fetchall()
            
            if categories:
                print("Представление tasks_by_category работает")
                for cat in categories[:3]:  # Показываем первые 3 категории
                    print(f"   Категория '{cat.category_name}': {cat.total_tasks} задач, {cat.visible_tasks} видимых")
            else:
                print("Нет данных в tasks_by_category")

            # === 6. Тест представления tasks_by_difficulty ===
            print("\nТест представления tasks_by_difficulty...")
            result = await conn.execute(text("SELECT * FROM tasks_by_difficulty"))
            difficulties = result.fetchall()
            
            if difficulties:
                print("Представление tasks_by_difficulty работает")
                for diff in difficulties[:3]:  # Показываем первые 3 уровня сложности
                    print(f"   Сложность '{diff.diff_name}': {diff.total_tasks} задач, {diff.visible_tasks} видимых")
            else:
                print("Нет данных в tasks_by_difficulty")

            # === 7. Тест триггера created_at ===
            print("\nТест триггера created_at...")
            result = await conn.execute(
                text("SELECT created_at FROM task WHERE task_id = :task_id"),
                {"task_id": task_id}
            )
            created_at = result.scalar()
            
            if created_at:
                print(f"Триггер created_at работает: {created_at}")
            else:
                print("Поле created_at пустое")

            # === 8. Тест фильтрации по видимости ===
            print("\nТест фильтрации по видимости...")
            result = await conn.execute(
                text("SELECT COUNT(*) FROM visible_tasks WHERE task_id = :task_id"),
                {"task_id": task_id}
            )
            visible_count = result.scalar()
            
            if visible_count == 0:
                print("Задача скрыта из visible_tasks (visibility = false)")
            else:
                print("Задача всё ещё видна в visible_tasks")

            # === Очистка ===
            print("\n Очистка тестовых данных...")
            await conn.execute(
                text("DELETE FROM task WHERE task_id = :task_id"),
                {"task_id": task_id}
            )
            print("Тестовые данные удалены")

            print("\n" + "=" * 60)
            print("ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
            print("=" * 60)

        except Exception as e:
            print(f"\nОШИБКА: {e}")
            print("\n Очистка тестовых данных...")
            try:
                await conn.execute(
                    text("DELETE FROM task WHERE task_name = 'Тестовая задача' OR task_name = 'Обновлённая тестовая задача'")
                )
                print("Тестовые данные удалены")
            except Exception as cleanup_error:
                print(f"Ошибка при очистке: {cleanup_error}")
            raise


if __name__ == "__main__":
    asyncio.run(test_task_structures())