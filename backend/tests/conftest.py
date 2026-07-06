import os

os.environ["DATABASE_URL"] = "sqlite:///./test_ga4_audit.db"
os.environ["ADMIN_KEY"] = "test-admin-key"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from main import app, Base, get_db
from models import Question
from seed_data import INITIAL_QUESTIONS

TEST_DB_URL = "sqlite:///./test_ga4_audit.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
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
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_ga4_audit.db"):
        os.remove("test_ga4_audit.db")


@pytest.fixture
def client():
    return TestClient(app)
