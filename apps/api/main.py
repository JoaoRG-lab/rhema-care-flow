import os
from datetime import date
from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from auth import create_access_token, decode_access_token, hash_password, verify_password
from database import Base, engine, get_db
from models import User
from crud_models import Appointment, Patient
from schemas import (
    AppointmentCreate,
    AppointmentResponse,
    DashboardResponse,
    HealthResponse,
    LoginRequest,
    LoginResponse,
    PatientCreate,
    PatientResponse,
    UserResponse,
)

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@rhema.local")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "admin123456")
ADMIN_NAME = os.getenv("SEED_ADMIN_NAME", "Rhema Admin")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://0.0.0.0:5173").split(",") if origin.strip()]

app = FastAPI(title="Rhema Care Flow Lite API", version="0.2.0")

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


def get_current_user(authorization: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    subject = decode_access_token(token)
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(subject)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive or missing user")
    return user


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


@app.get("/api/dashboard", response_model=DashboardResponse)
def dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DashboardResponse:
    patients = db.query(Patient).filter(Patient.owner_id == current_user.id).count()
    appointments = db.query(Appointment).filter(Appointment.owner_id == current_user.id).count()
    scheduled_today = db.query(Appointment).filter(
        Appointment.owner_id == current_user.id,
        Appointment.scheduled_date == date.today(),
    ).count()
    return DashboardResponse(patients=patients, appointments=appointments, scheduled_today=scheduled_today)


@app.get("/api/patients", response_model=list[PatientResponse])
def list_patients(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[PatientResponse]:
    return db.query(Patient).filter(Patient.owner_id == current_user.id).order_by(Patient.full_name.asc()).all()


@app.post("/api/patients", response_model=PatientResponse)
def create_patient(payload: PatientCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PatientResponse:
    patient = Patient(owner_id=current_user.id, **payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@app.get("/api/appointments", response_model=list[AppointmentResponse])
def list_appointments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[AppointmentResponse]:
    return db.query(Appointment).filter(Appointment.owner_id == current_user.id).order_by(Appointment.scheduled_date.desc(), Appointment.start_time.desc()).all()


@app.post("/api/appointments", response_model=AppointmentResponse)
def create_appointment(payload: AppointmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> AppointmentResponse:
    patient_name = payload.patient_name
    if payload.patient_id:
        patient = db.query(Patient).filter(Patient.id == payload.patient_id, Patient.owner_id == current_user.id).first()
        if not patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        patient_name = payload.patient_name or patient.full_name

    appointment = Appointment(owner_id=current_user.id, **payload.model_dump(exclude={"patient_name"}), patient_name=patient_name)
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


@app.get("/api/scores")
def list_scores(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "scores": [
            {"id": "das28-crp", "name": "DAS28-CRP", "domain": "Artrite Reumatoide"},
            {"id": "sdai", "name": "SDAI", "domain": "Artrite Reumatoide"},
            {"id": "basdai", "name": "BASDAI", "domain": "Espondiloartrites"},
            {"id": "sledai", "name": "SLEDAI-2K", "domain": "Lupus"},
        ]
    }
