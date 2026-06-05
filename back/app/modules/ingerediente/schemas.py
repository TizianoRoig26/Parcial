
from typing import Optional, List
from sqlmodel import SQLModel, Field

# ── Entrada ───────────────────────────────────────────────────────────────────

class IngredienteCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str = Field(min_length=2, max_length=500)
    es_alergeno: bool = Field(default=False)
    stock_cantidad: int = Field(default=0, ge=0)

class IngredienteUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=500)
    es_alergeno: Optional[bool] = None
    stock_cantidad: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None

class IngredienteStockUpdate(SQLModel):
    cantidad: int

# ── Salida ────────────────────────────────────────────────────────────────────

class IngredientePublic(SQLModel):
    id: int
    nombre: str
    descripcion: str
    es_alergeno: bool
    stock_cantidad: int
    is_active: bool

class IngredienteList(SQLModel):
    data: List[IngredientePublic]
    total: int
