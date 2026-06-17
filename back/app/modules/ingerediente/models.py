from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, DateTime, func

from app.modules.producto.links import ProductoIngrediente

if TYPE_CHECKING:
    from app.modules.producto.models import Producto


class Ingrediente(SQLModel, table=True):
    __tablename__ = "ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field (unique=True, nullable=False)
    descripcion: str = Field (max_length=500)
    es_alergeno: bool = Field (default=False, nullable=False)
    stock_cantidad: int = Field(default=0)
    is_active: bool  = Field (default=True)

    productos: list["Producto"] = Relationship(
        back_populates="ingredientes",
        link_model=ProductoIngrediente
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


