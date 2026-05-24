from datetime import date
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class HealthResponse(BaseModel):
    ok: bool
    service: str
    environment: str


class PatientCreate(BaseModel):
    full_name: str = Field(min_length=2)
    date_of_birth: date | None = None
    phone: str | None = None
    email: EmailStr | None = None
    diagnosis: str | None = None
    notes: str | None = None


class PatientResponse(PatientCreate):
    id: int

    class Config:
        from_attributes = True


class AppointmentCreate(BaseModel):
    patient_id: int | None = None
    patient_name: str = Field(min_length=2)
    scheduled_date: date
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    kind: str = "consulta"
    notes: str | None = None


class AppointmentResponse(AppointmentCreate):
    id: int
    status: str

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    patients: int
    appointments: int
    scheduled_today: int
