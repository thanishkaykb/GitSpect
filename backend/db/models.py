from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_email_verified = Column(Boolean, default=False)
    phone_number = Column(String, nullable=True)
    is_phone_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    analyses = relationship("AnalysisHistory", back_populates="owner", cascade="all, delete-orphan")

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    repo_url = Column(String)
    repo_name = Column(String)
    summary = Column(Text)
    analysis_results = Column(Text) # JSON string of found bugs
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="analyses")
