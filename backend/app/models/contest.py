from sqlalchemy import Column, Integer, String, DateTime, Time, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base, now_utc
from datetime import datetime, timedelta
from typing import List, Optional


class Contest(Base):
    __tablename__ = "contest"

    contest_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    contest_name = Column(String(200), nullable=False,unique=True,index=True)
    start_time = Column(DateTime(timezone=True), nullable=False,index=True)
    duration = Column(Integer, nullable=False)
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
        primaryjoin="and_(Contest.contest_id == Contest_User.cu_contest, Contest_User.role == 1)",
        back_populates="contest_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    organizers = relationship(
        "Contest_User",
        primaryjoin="and_(Contest.contest_id == Contest_User.cu_contest, Contest_User.role == 2)",
        viewonly=True,
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
    @property
    def get_tasks_list(self) -> List[int]:
        return self.tasks

    
    def get_end_time(self) -> datetime:
        return self.start_time + timedelta(minutes=self.duration)
    
    @property
    def is_active(self) -> bool:
        """Проверяет, активен ли контест в данный момент"""
        now = now_utc()
        return self.start_time <= now < self.get_end_time()
    @property
    def is_finished(self) -> bool:
        """Проверяет, завершён ли контест"""
        return now_utc() >= self.get_end_time()
    @property
    def is_upcoming(self) -> bool:
        """Проверяет, запланирован лиест на будущее"""
        return now_utc() < self.start_time

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
    def get_contest_author(self) -> int:
        author_id = None
        for participant in self.participants:
                if participant.is_organizer:
                    if author_id is None:  
                        author_id = participant.cu_user
        return author_id
    @property
    def organizer(self):
        return self.organizers[0] if self.organizers else None
   
    @property
    def contest_duration_str(self) -> str:
        hours = self.duration // 60
        minutes = self.duration % 60
        return f"{hours:02d}:{minutes:02d}:00"