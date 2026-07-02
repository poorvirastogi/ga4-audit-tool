from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, index=True)
    text = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)
    severity = Column(String, nullable=False)
    weight = Column(Integer, nullable=False)
    why = Column(String, nullable=False)
    fix = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)


class AuditRecord(Base):
    __tablename__ = "audit_records"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    label = Column(String, nullable=True)
    health_score = Column(Integer, nullable=False)
    band = Column(String, nullable=False)
    critical_count = Column(Integer, nullable=False)
    warning_count = Column(Integer, nullable=False)
    passed_count = Column(Integer, nullable=False)
    category_breakdown = Column(JSON, nullable=False)
    issues = Column(JSON, nullable=False)
    answers = Column(JSON, nullable=False)
