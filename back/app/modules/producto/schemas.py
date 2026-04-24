from typing import Optional, List
from sqlmodel import SQLModel, Field
from app.modules.categoria.schemas import CategoriaPublic
from app.modules.ingerediente.schemas import IngredientePublic



# ── Entrada ───────────────────────────────────────────────────────────────────

class ProductoCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str = Field(min_length=2, max_length=500)
    precio_base: int = Field(ge=0)
    stock_cantidad: int = Field(default=0, ge=0)
    imagen_url: str = Field(max_length=255)


class ProductoUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=500)
    precio_base: Optional[int] = Field(default=None, ge=0)
    stock_cantidad: Optional[int] = Field(default=None, ge=0)
    imagen_url: Optional[str] = Field(default=None, max_length=255)
    is_active: Optional[bool] = None



class CategoriaAssign(SQLModel):
    categoria_ids: List[int] = Field(default=None, min_length=1)

class IngredienteAssign(SQLModel):
    ingrediente_ids: List[int] = Field(default=None, min_length=1)


# ── Salida ────────────────────────────────────────────────────────────────────

class ProductoPublic(SQLModel):
    id: int
    nombre: str
    descripcion: str
    precio_base: int
    stock_cantidad: int
    imagen_url: str
    is_active: bool
    categorias: List[CategoriaPublic] = []
    ingredientes: List[IngredientePublic] = []



class ProductoList(SQLModel):
    data: List[ProductoPublic]
    total: int

