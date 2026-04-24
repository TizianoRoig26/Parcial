
from typing import Optional, List
from sqlmodel import SQLModel, Field



# ── Entrada ───────────────────────────────────────────────────────────────────

class CategoriaCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    parent_id: Optional[int] = None
    descripcion: str = Field(min_length=2, max_length=500)
    imagen_url: str = Field(max_length=255)


class CategoriaUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    parent_id: Optional[int] = None
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=500)
    imagen_url: Optional[str] = Field(default=None, max_length=255)


# ── Salida ────────────────────────────────────────────────────────────────────

class CategoriaPublic(SQLModel):
    id: int
    nombre: str
    descripcion: str
    imagen_url: str
    is_active: bool
    parent_id: Optional[int] = None


class CategoriaList(SQLModel):
    data: List[CategoriaPublic]
    total: int
