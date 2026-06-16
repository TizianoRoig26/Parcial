from typing import Optional, List
from sqlmodel import SQLModel, Field
from decimal import Decimal
from app.modules.categoria.schemas import CategoriaPublic
from app.modules.ingerediente.schemas import IngredientePublic
from app.modules.unidadMedida.schemas import UnidadMedidaPublic


# ── Entrada ───────────────────────────────────────────────────────────────────


class ProductoCreate(SQLModel):
    nombre: str = Field(min_length=2, max_length=100)
    descripcion: str = Field(min_length=2, max_length=500)
    precio_base: Decimal = Field(ge=0)
    imagen_url: str = Field(max_length=255)
    unidad_venta_id: Optional[int] = Field(default=None)


class ProductoUpdate(SQLModel):
    nombre: Optional[str] = Field(default=None, min_length=2, max_length=100)
    descripcion: Optional[str] = Field(default=None, min_length=2, max_length=500)
    precio_base: Optional[Decimal] = Field(default=None, ge=0)
    imagen_url: Optional[str] = Field(default=None, max_length=255)
    is_active: Optional[bool] = None
    unidad_venta_id: Optional[int] = Field(default=None)


class CategoriaAssign(SQLModel):
    categoria_ids: List[int] = Field(default_factory=list)


class IngredienteAssign(SQLModel):
    ingrediente_ids: List[int] = Field(default_factory=list)


class UnidadMedidaAssign(SQLModel):
    unidad_venta_id: Optional[int] = Field(default=None)


# ── Salida ────────────────────────────────────────────────────────────────────

class ProductoPublic(SQLModel):
    id: int
    nombre: str
    descripcion: str
    precio_base: Decimal
    imagen_url: str
    is_active: bool
    unidad_venta_id: Optional[int] = None
    unidad_medida: Optional[UnidadMedidaPublic] = None
    categorias: List[CategoriaPublic] = []
    ingredientes: List[IngredientePublic] = []
    


class ProductoList(SQLModel):
    data: List[ProductoPublic]
    total: int
