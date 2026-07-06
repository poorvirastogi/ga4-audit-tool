import os
from datetime import datetime
from typing import Literal, Dict, List, Optional

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, field_validator

from database import Base, engine, get_db
from models import Question, AuditRecord
from seed_data import INITIAL_QUESTIONS

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GA4 Audit Tool API")

FRONTEND_ORIGINS = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_KEY = os.environ.get("ADMIN_KEY", "dev-admin-key")


def require_admin(x_admin_key: Optional[str] = Header(None)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing admin key")


@app.on_event("startup")
def seed_questions():
    db = next(get_db())
    if db.query(Question).count() == 0:
        for i, q in enumerate(INITIAL_QUESTIONS):
            db.add(Question(
                id=q["id"], text=q["text"], category=q["category"],
                severity=q["severity"],
                weight=10 if q["severity"] == "Critical" else 5,
                why=q["why"], fix=q["fix"], order_index=i,
            ))
        db.commit()
    db.close()


class QuestionOut(BaseModel):
    id: str
    text: str
    category: str
    severity: str
    weight: int
    why: str
    fix: str
    order_index: int

    class Config:
        from_attributes = True


class QuestionIn(BaseModel):
    id: str
    text: str
    category: str
    severity: Literal["Critical", "Warning"]
    weight: int
    why: str
    fix: str
    order_index: int = 0

    @field_validator("id")
    @classmethod
    def id_must_be_slug_like(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("id cannot be empty")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("id must contain only letters, numbers, hyphens, and underscores")
        return v

    @field_validator("text", "category", "why", "fix")
    @classmethod
    def strings_must_not_be_blank(cls, v):
        v = v.strip()
        if not v:
            raise ValueError("field cannot be empty or whitespace")
        return v

    @field_validator("weight")
    @classmethod
    def weight_must_be_reasonable(cls, v):
        if v < 1 or v > 100:
            raise ValueError("weight must be between 1 and 100")
        return v

    @field_validator("order_index")
    @classmethod
    def order_index_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError("order_index cannot be negative")
        return v


class QuestionUpdate(BaseModel):
    text: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[Literal["Critical", "Warning"]] = None
    weight: Optional[int] = None
    why: Optional[str] = None
    fix: Optional[str] = None
    order_index: Optional[int] = None

    @field_validator("text", "category", "why", "fix")
    @classmethod
    def strings_must_not_be_blank_if_provided(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("field cannot be empty or whitespace")
        return v

    @field_validator("weight")
    @classmethod
    def weight_must_be_reasonable_if_provided(cls, v):
        if v is not None and (v < 1 or v > 100):
            raise ValueError("weight must be between 1 and 100")
        return v

    @field_validator("order_index")
    @classmethod
    def order_index_must_be_non_negative_if_provided(cls, v):
        if v is not None and v < 0:
            raise ValueError("order_index cannot be negative")
        return v


class AuditSubmission(BaseModel):
    answers: Dict[str, Literal["Yes", "Partial", "No"]]
    label: Optional[str] = None

    @field_validator("answers")
    @classmethod
    def answers_must_be_reasonable_size(cls, v):
        if len(v) > 100:
            raise ValueError("too many answers submitted")
        return v

class AuditRecordOut(BaseModel):
    id: int
    created_at: datetime
    label: Optional[str]
    health_score: int
    band: str
    critical_count: int
    warning_count: int
    passed_count: int
    category_breakdown: list
    issues: list

    class Config:
        from_attributes = True


ANSWER_MULTIPLIER = {"Yes": 1.0, "Partial": 0.5, "No": 0.0}


@app.get("/api/questions", response_model=List[QuestionOut])
def get_questions(db: Session = Depends(get_db)):
    return db.query(Question).order_by(Question.order_index).all()


@app.post("/api/audit", response_model=AuditRecordOut)
def score_audit(submission: AuditSubmission, db: Session = Depends(get_db)):
    questions = db.query(Question).order_by(Question.order_index).all()
    if not questions:
        raise HTTPException(status_code=500, detail="No questions configured")

    total_possible = 0
    total_scored = 0
    issues = []
    category_scores: Dict[str, Dict[str, float]] = {}

    for q in questions:
        answer = submission.answers.get(q.id, "No")
        multiplier = ANSWER_MULTIPLIER[answer]
        points = q.weight * multiplier

        total_possible += q.weight
        total_scored += points

        cat = q.category
        if cat not in category_scores:
            category_scores[cat] = {"scored": 0, "possible": 0}
        category_scores[cat]["scored"] += points
        category_scores[cat]["possible"] += q.weight

        status = "Passed" if answer == "Yes" else q.severity
        issues.append({
            "id": q.id, "text": q.text, "category": cat, "answer": answer,
            "status": status, "why": q.why, "fix": q.fix,
        })

    health_score = round((total_scored / total_possible) * 100) if total_possible else 0
    band = "Healthy" if health_score >= 80 else "Needs Attention" if health_score >= 50 else "Critical"

    critical_count = sum(1 for i in issues if i["status"] == "Critical")
    warning_count = sum(1 for i in issues if i["status"] == "Warning")
    passed_count = sum(1 for i in issues if i["status"] == "Passed")

    category_breakdown = [
        {"category": cat, "score": round((v["scored"] / v["possible"]) * 100) if v["possible"] else 0}
        for cat, v in category_scores.items()
    ]

    record = AuditRecord(
        label=submission.label,
        health_score=health_score, band=band,
        critical_count=critical_count, warning_count=warning_count, passed_count=passed_count,
        category_breakdown=category_breakdown, issues=issues, answers=submission.answers,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@app.get("/api/audits", response_model=List[AuditRecordOut])
def list_audits(limit: int = 20, db: Session = Depends(get_db)):
    return db.query(AuditRecord).order_by(desc(AuditRecord.created_at)).limit(limit).all()


@app.get("/api/audits/{audit_id}", response_model=AuditRecordOut)
def get_audit(audit_id: int, db: Session = Depends(get_db)):
    record = db.query(AuditRecord).filter(AuditRecord.id == audit_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Audit not found")
    return record


@app.get("/api/admin/questions", response_model=List[QuestionOut], dependencies=[Depends(require_admin)])
def admin_list_questions(db: Session = Depends(get_db)):
    return db.query(Question).order_by(Question.order_index).all()


@app.post("/api/admin/questions", response_model=QuestionOut, dependencies=[Depends(require_admin)])
def admin_create_question(question: QuestionIn, db: Session = Depends(get_db)):
    if db.query(Question).filter(Question.id == question.id).first():
        raise HTTPException(status_code=400, detail="Question ID already exists")
    q = Question(**question.dict())
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@app.put("/api/admin/questions/{question_id}", response_model=QuestionOut, dependencies=[Depends(require_admin)])
def admin_update_question(question_id: str, update: QuestionUpdate, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, value in update.dict(exclude_unset=True).items():
        setattr(q, field, value)
    db.commit()
    db.refresh(q)
    return q


@app.delete("/api/admin/questions/{question_id}", dependencies=[Depends(require_admin)])
def admin_delete_question(question_id: str, db: Session = Depends(get_db)):
    q = db.query(Question).filter(Question.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"deleted": question_id}
