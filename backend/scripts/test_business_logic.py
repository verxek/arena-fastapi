import asyncio
from sqlalchemy import text
from backend.app.database import engine


#  тест первой миграции со структурами user
async def test_business_logic():
    async with engine.begin() as conn:
        # Тест регистрации
        await conn.execute(
            text("CALL register_user(:nick, :pwd, :email)"),
            {"nick": "integration_test", "pwd": "test_hash", "email": "integration@test.com"}
        )
        
        # Проверка создания
        result = await conn.execute(
            text("SELECT user_id FROM \"user\" WHERE nickname = 'integration_test'")
        )
        user_id = result.scalar()
        print(f"Пользователь создан: ID={user_id}")
        
        # Тест представления
        result = await conn.execute(
            text("SELECT * FROM user_full_statistics WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        stats = result.fetchone()
        print(f"Статистика получена: {stats}")
        
        # Очистка
        await conn.execute(text("DELETE FROM \"user\" WHERE user_id = :user_id"), {"user_id": user_id})
        print("Тест завершён успешно!")

if __name__ == "__main__":
    asyncio.run(test_business_logic())