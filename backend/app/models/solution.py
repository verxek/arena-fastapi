from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base, now_utc
from datetime import datetime
from typing import Optional, List

class Solution(Base):
    __tablename__ = "solution"

    solution_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    sol_task = Column(Integer, ForeignKey('task.task_id', ondelete='CASCADE'), nullable=False,index=True)
    sol_user = Column(Integer, ForeignKey('user.user_id', ondelete='CASCADE'), nullable=False,index=True)
    sol_prog_lang = Column(Integer, ForeignKey('prog_language.proglang_id', ondelete='SET NULL'), nullable=True,index=True)
    sol_state = Column(Integer, ForeignKey('solution_state.solution_state_id', ondelete='CASCADE'), nullable=False,index=True)
    sol_created_at = Column(DateTime(timezone=True), nullable=False, default=now_utc)

    # связи
    task_rel = relationship(
        "Task",
        back_populates="solutions",
        foreign_keys=[sol_task],
        lazy="selectin"
    )
    user_rel = relationship(
        "User",
        back_populates="solutions",
        foreign_keys=[sol_user],
        lazy="selectin"
    )
    language_rel = relationship(
        "Prog_Language",
        back_populates="solutions",
        foreign_keys=[sol_prog_lang],
        lazy="selectin"
    )
    state_rel = relationship(
        "Solution_State",
        back_populates="solutions",
        foreign_keys=[sol_state],
        lazy="selectin"
    )
    sandbox_rel = relationship(
        "Sandbox",
        back_populates="solution_rel",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        Index('idx_solution_task', 'sol_task'),
        Index('idx_solution_user', 'sol_user'),
        Index('idx_solution_state', 'sol_state'),
        Index('idx_solution_created', 'sol_created_at'),
    )

    def __repr__(self):
        return f"<Solution(id={self.solution_id}, task_id={self.sol_task}, user_id={self.sol_user})>"

    @property
    def is_accepted(self) -> bool:
        """Проверяет, принято ли решение"""
        return self.state_rel and self.state_rel.state_name == "Accepted"

    @property
    def is_wrong_answer(self) -> bool:
        """Проверяет, является ли решение неправильным"""
        return self.state_rel and self.state_rel.state_name == "Wrong Answer"

    @property
    def is_time_limit_exceeded(self) -> bool:
        """Проверяет, превышен ли лимит времени"""
        return self.state_rel and self.state_rel.state_name == "Time Limit Exceeded"

    @property
    def is_runtime_error(self) -> bool:
        """Проверяет, возникла ли ошибка выполнения"""
        return self.state_rel and self.state_rel.state_name == "Runtime Error"

    @property
    def time_since_created(self) -> str:
        """Возвращает время с момента создания решения"""
        from datetime import datetime
        delta = now_utc - self.sol_created_at
        hours, remainder = divmod(delta.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{delta.days}d {hours}h {minutes}m {seconds}s"

    @property
    def task_name(self) -> Optional[str]:
        """Возвращает название задачи"""
        return self.task_rel.task_name if self.task_rel else None

    @property
    def user_nickname(self) -> Optional[str]:
        """Возвращает никнейм пользователя"""
        return self.user_rel.nickname if self.user_rel else None

    @property
    def language_name(self) -> Optional[str]:
        """Возвращает название языка программирования"""
        return self.language_rel.prog_lang_name if self.language_rel else None