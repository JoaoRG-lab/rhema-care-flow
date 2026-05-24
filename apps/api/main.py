import os
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from auth import create_access_token, hash_password, verify_password
from database import Base, engine, get_db
from models import User
from schemas import HealthResponse, LoginRequest, LoginResponse, UserResponse

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@rhema.local")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "admin123456")
ADMIN_NAME = os.getenv("SEED_ADMIN_NAME", "Rhema Admin")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://0.0.0.0:5173").split(",") if origin.strip()]

app = FastAPI(title="Rhema Care Flow Lite API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def bootstrap_database() -> None:
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not existing:
            db.add(User(email=ADMIN_EMAIL, full_name=ADMIN_NAME, password_hash=hash_password(ADMIN_PASSWORD)))
            db.commit()
    finally:
        db.close()


@app.on_event("startup")
def on_startup() -> None:
    bootstrap_database()


@app.get("/api/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(ok=True, service="rhema-care-flow-lite-api", environment=ENVIRONMENT)


@app.post("/api/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return LoginResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name),
    )
