from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base
from typing import List

class Contest_User(Base):
    __tablename__ = "contest_user"

    user_contest_id = Column(Integer, primary_key=True, autoincrement=True,index=True)

    cu_user = Column(Integer, ForeignKey('user.user_id', ondelete='CASCADE'), nullable=False)
    cu_contest = Column(Integer, ForeignKey('contest.contest_id', ondelete='CASCADE'), nullable=False)
    role = Column(Integer, ForeignKey('contest_role.role_id', ondelete='CASCADE'), nullable=False)

    # связи
    user_rel = relationship(
        "User",
        back_populates="contest_participations",
        foreign_keys=[cu_user],
        lazy="selectin"
    )
    contest_rel = relationship(
        "Contest",
        back_populates="participants",
        foreign_keys=[cu_contest],
        lazy="selectin"
    )
    role_rel = relationship(
        "Contest_Role",
        back_populates="contest_participations",
        foreign_keys=[role],
        lazy="selectin"
    )


    def __repr__(self):
        return f"<Contest_User(user_id={self.cu_user}, contest_id={self.cu_contest}, role_id={self.role})>"

    @property
    def user_nickname(self) -> str:
        """Возвращает никнейм пользователя"""
        return self.user_rel.nickname if self.user_rel else "Unknown"

    @property
    def contest_name(self) -> str:
        """Возвращает название контеста"""
        return self.contest_rel.contest_name if self.contest_rel else "Unknown"

    @property
    def role_name(self) -> str:
        """Возвращает название роли"""
        return self.role_rel.role_name if self.role_rel else "Unknown"

    @property
    def is_organizer(self) -> bool:
        """Проверяет, является ли пользователь организатором контеста"""
        return self.role_rel and self.role_rel.role_id == 2

    @property
    def is_participant(self) -> bool:
        """Проверяет, является ли пользователь участником контеста"""
        return self.role_rel and self.role_rel.role_id == 1