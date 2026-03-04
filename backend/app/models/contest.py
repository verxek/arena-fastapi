from sqlalchemy import Column, Integer, String, DateTime, Time, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base, now_utc
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.dialects.postgresql import INTERVAL

class Contest(Base):
    __tablename__ = "contest"

    contest_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    contest_name = Column(String(200), nullable=False,unique=True,index=True)
    start_time = Column(DateTime(timezone=True), nullable=False,index=True)
    duration = Column(INTERVAL, nullable=False)
    contest_created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc,index=True)
    
    contest_status = Column(Integer, ForeignKey('contest_status.contest_status_id', ondelete='CASCADE'), nullable=False,index=True)

    # связи
    status_rel = relationship(
        "Contest_Status",
        back_populates="contests",
        lazy="selectin"
    )
    participants = relationship(
        "Contest_User",
        back_populates="contest_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    tasks = relationship(
        "Contest_Task",
        back_populates="contest_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        Index('idx_contest_start', 'start_time'),
        Index('idx_contest_duration', 'duration'),
        Index('idx_contest_created', 'contest_created_at'),
        UniqueConstraint('contest_name', name='uq_contest_name'),
    )

    def __repr__(self):
        return f"<Contest(id={self.contest_id}, name='{self.contest_name}')>"

    def get_end_time(self) -> datetime:
        """Возвращает время окончания контеста"""
        duration_seconds = (
            self.duration.hour * 3600 +
            self.duration.minute * 60 +
            self.duration.second
        )
        return self.start_time + timedelta(seconds=duration_seconds)

    def is_active(self) -> bool:
        """Проверяет, активен ли контест в данный момент"""
        now = now_utc
        return self.start_time <= now < self.get_end_time()

    def is_finished(self) -> bool:
        """Проверяет, завершён ли контест"""
        return now_utc >= self.get_end_time()

    def is_upcoming(self) -> bool:
        """Проверяет, запланирован лиест на будущее"""
        return now_utc < self.start_time

    @property
    def total_participants(self) -> int:
        """Количество участников контеста"""
        return len(self.participants)

    @property
    def total_tasks(self) -> int:
        """Количество задач в контесте"""
        return len(self.tasks)

    @property
    def active_participants(self) -> List:
        """Список активных участников (с фильтром по статусу)"""
        return [p for p in self.participants if p.role_rel.role_name != "Removed"]

    @property
    def contest_duration_str(self) -> str:
        """Возвращает продолжительность контеста в строковом формате (чч:мм:сс)"""
        total_seconds = self.duration.total_seconds()
        hours = int(total_seconds // 3600)
        minutes = int((total_seconds % 3600) // 60)
        seconds = int(total_seconds % 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"