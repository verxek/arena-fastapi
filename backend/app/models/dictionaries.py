from sqlalchemy import Column, Integer, String, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from database import Base
from typing import List


# УРОВЕНЬ СЛОЖНОСТИ ЗАДАЧИ
class Difficulty_Level(Base):
    __tablename__ = "difficulty_level"

    difficulty_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    diff_name = Column(String(20), nullable=False,unique=True,index=True)

    # связи
    tasks = relationship(
        "Task",
        back_populates="difficulty_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        UniqueConstraint('diff_name', name='uq_difficulty_name'),
    )

    def __repr__(self):
        return f"<Difficulty_Level(id={self.difficulty_id}, name='{self.diff_name}')>"

    @property
    def task_count(self) -> int:
        """Количество задач с этим уровнем сложности"""
        return len(self.tasks)
    

# КАТЕГОРИЯ ЗАДАЧИ
class Task_Category(Base):
    __tablename__ = "task_category"

    category_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    category_name = Column(String(30), nullable=False,unique=True,index=True)

    # связи
    tasks = relationship(
        "Task",
        back_populates="category_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        UniqueConstraint('category_name', name='uq_category_name'),
    )

    def __repr__(self):
        return f"<Task_Category(id={self.category_id}, name='{self.category_name}')>"

    @property
    def task_count(self) -> int:
        """Количество задач в этой категории"""
        return len(self.tasks)
    

# СТАТУС КОНТЕСТА
class Contest_Status(Base):
    __tablename__ = "contest_status"

    contest_status_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    status_name = Column(String(15), nullable=False,unique=True,index=True)

    # связи
    contests = relationship(
        "Contest",
        back_populates="status_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        UniqueConstraint('status_name', name='uq_contest_status_name'),
    )

    def __repr__(self):
        return f"<Contest_Status(id={self.contest_status_id}, name='{self.status_name}')>"

    @property
    def contest_count(self) -> int:
        """Количество контестов с этим статусом"""
        return len(self.contests)
    

# СТАТУС РЕШЕНИЯ
class Solution_State(Base):
    __tablename__ = "solution_state"

    solution_state_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    state_name = Column(String(30), nullable=False,unique=True,index=True)

    # связи
    solutions = relationship(
        "Solution",
        back_populates="state_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        UniqueConstraint('state_name', name='uq_solution_state_name'),
    )

    def __repr__(self):
        return f"<Solution_State(id={self.solution_state_id}, name='{self.state_name}')>"

    @property
    def solution_count(self) -> int:
        """Количество решений с этим статусом"""
        return len(self.solutions)
    

# ЯЗЫК ПРОГРАММИРОВАНИЯ
class Prog_Language(Base):
    __tablename__ = "prog_language"

    proglang_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    prog_lang_name = Column(String(30), nullable=False,unique=True,index=True)

    # связи
    solutions = relationship(
        "Solution",
        back_populates="language_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        UniqueConstraint('prog_lang_name', name='uq_prog_lang_name'),
    )

    def __repr__(self):
        return f"<Prog_Language(id={self.proglang_id}, name='{self.prog_lang_name}')>"

    @property
    def solution_count(self) -> int:
        """Количество решений на этом языке"""
        return len(self.solutions)
    

# ВЕРДИКТЫ ПЕСОЧНИЦЫ
class Sandbox_Verdict(Base):
    __tablename__ = "sandbox_verdict"

    verdict_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    verdict_name = Column(String(30), nullable=False,unique=True,index=True)

    # связи
    sandboxes = relationship(
        "Sandbox",
        back_populates="verdict_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        UniqueConstraint('verdict_name', name='uq_verdict_name'),
    )

    def __repr__(self):
        return f"<Sandbox_Verdict(id={self.verdict_id}, name='{self.verdict_name}')>"

    @property
    def sandbox_count(self) -> int:
        """Количество песочниц с этим вердиктом"""
        return len(self.sandboxes)
    

# РОЛЬ В КОНТЕСТЕ
class Contest_Role(Base):
    __tablename__ = "contest_role"

    role_id = Column(Integer, primary_key=True, autoincrement=True)

    role_name = Column(String(20), nullable=False,unique=True)

    # связи
    contest_participations = relationship(
        "Contest_User",
        back_populates="role_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self):
        return f"<Contest_Role(id={self.role_id}, name='{self.role_name}')>"

    @property
    def participant_count(self) -> int:
        """Количество участников с этой ролью"""
        return len(self.contest_participations)