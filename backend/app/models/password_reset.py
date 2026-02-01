from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, UniqueConstraint, Index, Integer
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timedelta
from typing import Optional
import secrets

class PasswordReset(Base):
    __tablename__ = "password_reset"

    token = Column(String(255), primary_key=True, unique=True,nullable=False,index=True)

    user_id = Column(Integer, ForeignKey('user.user_id', ondelete='CASCADE'), nullable=False,index=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.now(datetime.timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)

    used = Column(Boolean, default=False, nullable=False)

    # связь с User
    user_rel = relationship(
        "User",
        back_populates="password_resets",
        lazy="selectin"
    )

    def __init__(self, user_id: int, duration_minutes: int = 30):
        """
        Создаёт новый токен сброса пароля
        
        :param user_id: ID пользователя
        :param duration_minutes: Длительность токена в минутах (по умолчанию 30 минут)
        """
        super().__init__()
        self.token = self._generate_token()
        self.user_id = user_id
        self.expires_at = datetime.now(datetime.timezone.utc) + timedelta(minutes=duration_minutes)

    @staticmethod
    def _generate_token() -> str:
        """Генерирует безопасный токен сброса пароля (64 символа)"""
        return secrets.token_urlsafe(48)

    def is_valid(self) -> bool:
        """Проверяет, валиден ли токен (не истёк и не использован)"""
        now = datetime.now(datetime.timezone.utc)
        return not self.used and now < self.expires_at

    def is_expired(self) -> bool:
        """Проверяет, истёк ли токен"""
        return datetime.now(datetime.timezone.utc) > self.expires_at

    def mark_as_used(self):
        """Помечает токен как использованный"""
        self.used = True

    def __repr__(self):
        return f"<PasswordReset(token='{self.token[:8]}...', user_id={self.user_id}, expires={self.expires_at})>"

    # индексы
    __table_args__ = (
        Index('idx_password_reset_expires', 'expires_at'),
        Index('idx_password_reset_user', 'user_id'),
    )