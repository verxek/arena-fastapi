from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    token = Column(String, nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("user.user_id"))
    expires_at = Column(DateTime(timezone=True))