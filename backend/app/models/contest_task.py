from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.database import Base
from typing import List

class Contest_Task(Base):
    __tablename__ = "contest_task"

    task_contest_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    task_ct = Column(Integer, ForeignKey('task.task_id', ondelete='CASCADE'), nullable=False,index=True)
    contest_ct = Column(Integer, ForeignKey('contest.contest_id', ondelete='CASCADE'), nullable=False,index=True)

    # связи
    task_rel = relationship(
        "Task",
        back_populates="contest_tasks",
        foreign_keys=[task_ct],
        lazy="selectin"
    )
    contest_rel = relationship(
        "Contest",
        back_populates="tasks",
        foreign_keys=[contest_ct],
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        UniqueConstraint('task_ct', 'contest_ct', name='uq_contest_task'),
        Index('idx_contest_task_task', 'task_ct'),
        Index('idx_contest_task_contest', 'contest_ct'),
    )

    def __repr__(self):
        return f"<Contest_Task(task_id={self.task_ct}, contest_id={self.contest_ct})>"

    @property
    def task_name(self) -> str:
        """Возвращает название задачи"""
        return self.task_rel.task_name if self.task_rel else "Unknown"

    @property
    def contest_name(self) -> str:
        """Возвращает название контеста"""
        return self.contest_rel.contest_name if self.contest_rel else "Unknown"

    @property
    def difficulty_name(self) -> str:
        """Возвращает название уровня сложности"""
        return self.task_rel.difficulty_rel.diff_name if self.task_rel and self.task_rel.difficulty_rel else "Unknown"

    @property
    def category_name(self) -> str:
        """Возвращает название категории задачи"""
        return self.task_rel.category_rel.category_name if self.task_rel and self.task_rel.category_rel else "Unknown"

    @property
    def task_statistics(self) -> dict:
        """Возвращает статистику по задаче в контесте"""
        if not self.task_rel:
            return {}
        
        total_solutions = len(self.task_rel.solutions)
        accepted_solutions = sum(1 for sol in self.task_rel.solutions if sol.is_accepted)
        
        return {
            "total_solutions": total_solutions,
            "accepted_solutions": accepted_solutions,
            "success_rate": round((accepted_solutions / total_solutions * 100), 2) if total_solutions > 0 else 0
        }