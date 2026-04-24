# app/modules/ingerediente/schemas.py
from typing import Optional, List
from sqlmodel import SQLModel, Field

# ── Entrada ───────────────────────────────────────────────────────────────────

class IngredienteCreate(SQLModel):
    """Body para POST /ingredientes/"""
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str = Field(min_length=2, max_length=500)
    es_alergeno: bool = Field(default=False)

class IngredienteUpdate(SQLModel):
    """Body para PATCH /ingredientes/{id}"""
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=500)
    es_alergeno: Optional[bool] = None
    is_active: Optional[bool] = None

# ── Salida ────────────────────────────────────────────────────────────────────

class IngredientePublic(SQLModel):
    """Response model para Ingrediente"""
    id: int
    nombre: str
    descripcion: str
    es_alergeno: bool
    is_active: bool

class IngredienteList(SQLModel):
    """Response model paginado"""
    data: List[IngredientePublic]
    total: int
