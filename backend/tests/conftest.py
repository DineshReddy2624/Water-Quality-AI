import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.database.base import Base
from app.database.session import get_db
from app.main import app
from app.core.security import get_password_hash
from app.models.user import User

TEST_DATABASE_URL = "sqlite:///./test_aquasense.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    # Create test admin & user
    admin = db.query(User).filter(User.email == "testadmin@aquasense.org").first()
    if not admin:
        admin = User(
            email="testadmin@aquasense.org",
            hashed_password=get_password_hash("AdminPass123!"),
            full_name="Test Admin",
            role="admin",
            is_active=True
        )
        db.add(admin)
    
    user = db.query(User).filter(User.email == "testuser@aquasense.org").first()
    if not user:
        user = User(
            email="testuser@aquasense.org",
            hashed_password=get_password_hash("UserPass123!"),
            full_name="Test User",
            role="standard",
            is_active=True
        )
        db.add(user)
    db.commit()
    db.close()

    yield

    # Teardown
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_aquasense.db"):
        try:
            os.remove("./test_aquasense.db")
        except Exception:
            pass

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def auth_headers(client):
    login_resp = client.post("/api/auth/login", json={
        "email": "testadmin@aquasense.org",
        "password": "AdminPass123!"
    })
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
