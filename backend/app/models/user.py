from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    nickname = Column(String(50), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    registration_date = Column(DateTime(timezone=True), nullable=False, default=datetime.now(datetime.timezone.utc))

    # связи
    authored_tasks = relationship(
        "Task",
        back_populates="author_rel",
        foreign_keys="Task.author",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    solutions = relationship(
        "Solution",
        back_populates="user_rel",
        foreign_keys="Solution.sol_user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    contest_participations = relationship(
        "Contest_User",
        back_populates="user_rel",
        foreign_keys="Contest_User.cu_user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    sessions = relationship(
        "Session",
        back_populates="user_rel",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="desc(Session.created_at)"
    )
    password_resets = relationship(
        "PasswordReset",
        back_populates="user_rel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    # индексы
    __table_args__ = (
        Index('idx_user_registration', 'registration_date'),
        Index('idx_user_nickname', 'nickname'),
        UniqueConstraint('email', name='uq_user_email'),
    )

    def __repr__(self):
        return f"<User(id={self.user_id}, nickname='{self.nickname}')>"

    @property
    def solved_tasks_count(self) -> int:
        """Актуальное количество решённых задач через связь с решениями"""
        return sum(
            1 for sol in self.solutions 
            if hasattr(sol, 'sol_state_rel') 
            and sol.sol_state_rel 
            and sol.sol_state_rel.state_name == "Accepted"
        )