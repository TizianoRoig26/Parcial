
from typing import Optional, List
from sqlmodel import SQLModel, Field


# ── Entrada ───────────────────────────────────────────────────────────────────

class UnidadMedidaCreate(SQLModel):
    nombre: str = Field(min_length=1, max_length=100)
    simbolo: str = Field(min_length=1, max_length=10)
    tipo: str = Field(min_length=1, max_length=50)


class UnidadMedidaUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=1, max_length=100)
    simbolo: Optional[str] = Field(default=None, min_length=1, max_length=10)
    tipo: Optional[str] = Field(default=None, min_length=1, max_length=50)
    is_active: Optional[bool] = None


# ── Salida ────────────────────────────────────────────────────────────────────

class UnidadMedidaPublic(SQLModel):
    id: int
    nombre: str
    simbolo: str
    tipo: str
    is_active: bool


class UnidadMedidaList(SQLModel):
    data: List[UnidadMedidaPublic]
    total: int
