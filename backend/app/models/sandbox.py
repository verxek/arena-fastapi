from sqlalchemy import Column, Integer, Text, Time, Float, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base
from datetime import datetime, timedelta
from typing import Optional

class Sandbox(Base):
    __tablename__ = "sandbox"

    sandbox_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    sandbox_sol = Column(Integer, ForeignKey('solution.solution_id', ondelete='CASCADE'), nullable=False, index=True)
    sandbox_ver = Column(Integer, ForeignKey('sandbox_verdict.verdict_id', ondelete='CASCADE'), nullable=False,index=True)

    output = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, nullable=False)
    memory_used_kb = Column(Integer)
    test_number = Column(Integer, nullable=False)
    error_output = Column(Text)
    # связи
    solution_rel = relationship(
        "Solution",
        back_populates="sandbox_rel",
        lazy="selectin"
    )
    verdict_rel = relationship(
        "Sandbox_Verdict",
        back_populates="sandboxes",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        Index('idx_sandbox_solution', 'sandbox_sol'),
        Index('idx_sandbox_verdict', 'sandbox_ver'),
    )

    def __repr__(self):
        return f"<Sandbox(id={self.sandbox_id}, solution_id={self.sandbox_sol})>"

    

    @property
    def is_memory_exceeded(self) -> bool:
        """Проверяет, превышена ли память"""
        if not self.solution_rel or self.memory_used_kb is None:
            return False
        return self.memory_used_kb > self.solution_rel.task_rel.memory_limit


    @property
    def is_time_exceeded(self) -> bool:
        """Проверяет, превышено ли время выполнения"""
        if not self.solution_rel:
            return False
        return self.execution_time_ms > self.solution_rel.task_rel.time_limit
    
    @property
    def execution_time_seconds(self) -> float:
        return self.execution_time_ms / 1000 if self.execution_time_ms else 0.0
    @property
    def verdict_name(self) -> Optional[str]:
        """Возвращает название вердикта"""
        return self.verdict_rel.verdict_name if self.verdict_rel else None

    @property
    def memory_used_mb(self) -> float:
        return self.memory_used_kb / 1024 if self.memory_used_kb else 0.0

    @property
    def solution_id(self) -> Optional[int]:
        """Возвращает ID решения"""
        return self.solution_rel.solution_id if self.solution_rel else None

    @property
    def task_id(self) -> Optional[int]:
        """Возвращает ID задачи"""
        return self.solution_rel.task_rel.task_id if self.solution_rel and self.solution_rel.task_rel else None