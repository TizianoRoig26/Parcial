from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal
from sqlalchemy import Numeric, Column, DateTime, func, JSON

from app.modules.producto.links import ProductoCategoria, ProductoIngrediente

if TYPE_CHECKING:
    from app.modules.categoria.models import Categoria
    from app.modules.ingerediente.models import Ingrediente
    from app.modules.unidadMedida.models import UnidadMedida


class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    descripcion: str
    precio_base: Decimal = Field(sa_type=Numeric(10, 2))
    imagen_url: List[str] = Field(
        default_factory=list,
        sa_column=Column(JSON, nullable=False, server_default="[]")
    )
    is_active: bool = Field(default=True)
    unidad_venta_id: Optional[int] = Field(
        default=None, foreign_key="unidad_medidas.id"
    )

    unidad_medida: Optional["UnidadMedida"] = Relationship(back_populates="productos")

    categorias: List["Categoria"] = Relationship(
        back_populates="productos",
        link_model=ProductoCategoria,
        sa_relationship_kwargs={"overlaps": "producto,categoria"},
    )

    ingredientes: List["Ingrediente"] = Relationship(
        back_populates="productos",
        link_model=ProductoIngrediente,
        sa_relationship_kwargs={"overlaps": "producto,ingrediente"},
    )

    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )
    deleted_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )
