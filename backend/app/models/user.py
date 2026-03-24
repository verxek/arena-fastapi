from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint, Index, Enum
from sqlalchemy.orm import relationship
from backend.app.database import Base, now_utc
from datetime import datetime
import enum

class UserRole(str, enum.Enum):
    participant = "participant"
    organizer = "organizer"
    admin = "admin"

class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    nickname = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), nullable=False, unique=True, index=True)
    registration_date = Column(DateTime(timezone=True), nullable=False, default=now_utc)
    
    role = Column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        server_default=UserRole.participant.value
    )

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
            and sol.state_rel 
            and sol.state_rel.state_name == "Accepted"
        )
    @property
    def authored_tasks_count(self) -> int:
        """Количество задач, созданных пользователем"""
        return len(self.created_tasks) if self.created_tasks else 0

    @property
    def organized_contests_count(self) -> int:
        """Количество контестов, где пользователь является Организатором"""
        if not self.contest_participations:
            return 0
        
        count = 0
        for participation in self.contest_participations:
            if participation.is_organizer:
                count += 1
        return count
    
    @property
    def participated_contests_count(self) -> int:
        """
        Количество контестов, в которых пользователь поучаствовал.
        Участие = наличие хотя бы одной посылки (Solution), отправленной:
        1. К задаче, входящей в контест.
        2. Временем, попадающим в интервал проведения этого контеста.
        """
        if not self.solutions:
            return 0

        unique_contest_ids = set()

        for solution in self.solutions:
            # Пропускаем решения без задачи или времени
            if not solution.task_rel or not solution.sol_created_at:
                continue

            task = solution.task_rel
            submit_time = solution.sol_created_at

            # Получаем список связей задачи с контестами
            contest_links = getattr(task, 'contest_tasks', [])
            
            if not contest_links:
                continue

            for link in contest_links:
                contest = link.contest_rel 
                
                if not contest:
                    continue
                
                start_time = contest.start_time
                duration_minutes = contest.duration 
                
                # Рассчитываем конец контеста
                from datetime import timedelta
                end_time = start_time + timedelta(minutes=duration_minutes)

                if start_time <= submit_time <= end_time:
                    unique_contest_ids.add(contest.contest_id)

        return len(unique_contest_ids)