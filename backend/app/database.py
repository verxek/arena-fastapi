from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import TIMESTAMP
from typing import AsyncGenerator
import os
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# URL подключения
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:123qwe@localhost:5432/code_arena"
)

# Асинхронный движок
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

class Base(DeclarativeBase):
    """Базовый класс"""
    type_annotation_map = {
        datetime: TIMESTAMP(timezone=True),  # пока что в utc
    }

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Асинхронная сессия для зависимостей FastAPI"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    """Создание всех таблиц (асинхронно)"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

def now_utc() -> datetime:
    """Текущее время в UTC"""
    return datetime.now(timezone.utc)



# СИНХРОННАЯ ВЕРСИЯ ДЛЯ CELERY
SYNC_DATABASE_URL = DATABASE_URL.replace(
    "postgresql+asyncpg",
    "postgresql+psycopg2"
)

sync_engine = create_engine(
    SYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)