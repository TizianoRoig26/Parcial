# ─── Esquemas Pydantic (sin table=True) ──────────────────────────────────────

from sqlmodel import SQLModel, Field
from pydantic import EmailStr


class RolPublic(SQLModel):
    codigo: str
    nombre: str
    descripcion: str | None = None


class UserCreate(SQLModel):
    """Datos requeridos para registrar un usuario."""
    username:  str
    full_name: str
    email:     EmailStr
    password:  str = Field(min_length=8)


class UserPublic(SQLModel):
    """Vista pública del usuario — excluye hashed_password."""
    id:        int
    username:  str
    full_name: str
    email:     str
    disabled:  bool
    roles:     list[RolPublic] = Field(default_factory=list)


class Token(SQLModel):
    """Respuesta del endpoint /token."""
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int  # segundos hasta expiración
