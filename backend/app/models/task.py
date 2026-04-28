from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, UniqueConstraint, Index, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from backend.app.database import Base, now_utc
from datetime import datetime
from typing import List, Optional

class Task(Base):
    __tablename__ = "task"

    task_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    task_name = Column(String(50), nullable=False,unique=True,index=True)
    statement = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    visibility = Column(Boolean, default=True, nullable=False)
    make_visible_after_contest = Column(Boolean, default=False, nullable=False)

    author = Column(Integer, ForeignKey('user.user_id', ondelete='SET NULL'), nullable=True,index=True)

    difficulty = Column(Integer, ForeignKey('difficulty_level.difficulty_id', ondelete='CASCADE'), nullable=False,index=True)
    category = Column(Integer, ForeignKey('task_category.category_id', ondelete='CASCADE'), nullable=False,index=True)

    time_limit = Column(Integer, nullable=False)  # в миллисекундах
    memory_limit = Column(Integer, nullable=False)  # в мегабайтах

    input_format = Column(Text, nullable=True) 
    output_format = Column(Text, nullable=True) 
    examples = Column(JSON, nullable=True)

    status = Column(String, default="DRAFT")

    # связи
    author_rel = relationship(
        "User",
        back_populates="authored_tasks",
        foreign_keys=[author],
        lazy="selectin"
    )
    difficulty_rel = relationship(
        "Difficulty_Level",
        back_populates="tasks",
        lazy="selectin"
    )
    category_rel = relationship(
        "Task_Category",
        back_populates="tasks",
        lazy="selectin"
    )
    contest_tasks = relationship(
        "Contest_Task",
        back_populates="task_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    solutions = relationship(
        "Solution",
        back_populates="task_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        Index('idx_task_difficulty', 'difficulty'),
        Index('idx_task_category', 'category'),
        Index('idx_task_author', 'author'),
        Index('idx_task_visibility', 'visibility'),
        UniqueConstraint('task_name', name='uq_task_name'),
    )

    def __repr__(self):
        return f"<Task(id={self.task_id}, name='{self.task_name}')>"

    @property
    def is_visible(self) -> bool:
        """Проверяет, видима ли задача для пользователя"""
        return self.visibility

    @property
    def contest_count(self) -> int:
        """Количество контестов, где используется задача"""
        return len(self.contest_tasks)

    @property
    def accepted_solutions_count(self) -> int:
        """Количество принятых решений для задачи"""
        return sum(
            1 for sol in self.solutions 
            if sol.sol_state_rel and sol.sol_state_rel.state_name == "Accepted"
        )

    @property
    def solution_success_rate(self) -> float:
        """Процент успешных решений"""
        total = len(self.solutions)
        if total == 0:
            return 0.0
        accepted = self.accepted_solutions_count
        return round((accepted / total) * 100, 2)