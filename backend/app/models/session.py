from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import INET
from datetime import datetime, timedelta
from app.database import Base, now_utc
import secrets

class Session(Base):
    __tablename__ = "session"

    session_id = Column(String(64), primary_key=True, unique=True, nullable=False,index=True)

    user_id = Column(Integer, ForeignKey('user.user_id', ondelete='CASCADE'), nullable=False,index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    expires_at = Column(DateTime(timezone=True), nullable=False)

    ip_address = Column(INET, nullable=False)
    user_agent = Column(Text, nullable=False)

    # связи
    user_rel = relationship(
        "User",
        back_populates="sessions",
        lazy="joined"
    )

    def __init__(self, user_id: int, ip_address: str, user_agent: str, duration_minutes: int = 360):
        """
        Создаёт новую сессию
        
        :param user_id: ID пользователя
        :param ip_address: IP-адрес клиента
        :param user_agent: User-Agent браузера
        :param duration_minutes: Длительность сессии в минутах (по умолчанию 6 часов)
        """
        super().__init__()
        self.session_id = self._generate_session_id()
        self.user_id = user_id
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.expires_at = now_utc + timedelta(minutes=duration_minutes)

    @staticmethod
    def _generate_session_id() -> str:
        """Генерирует уникальный ID сессии (64 символа в hex)"""
        return secrets.token_hex(32)

    def is_expired(self) -> bool:
        """Проверяет, истекла ли сессия"""
        return now_utc > self.expires_at

    def remaining_time(self) -> timedelta:
        """Возвращает оставшееся время сессии"""
        now = now_utc
        if self.is_expired():
            return timedelta(0)
        return self.expires_at - now

    def extend(self, additional_minutes: int = 60):
        """Продлевает сессию на указанное количество минут"""
        self.expires_at = self.expires_at + timedelta(minutes=additional_minutes)

    def __repr__(self):
        return f"<Session(id={self.session_id[:8]}..., user_id={self.user_id}, expires={self.expires_at})>"

    # индексы
    __table_args__ = (
        Index('idx_session_expires', 'expires_at'),
        Index('idx_session_user', 'user_id'),
        Index('idx_session_created', 'created_at'),
    )