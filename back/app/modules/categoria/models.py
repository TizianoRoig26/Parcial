# app/modules/categoria/models.py
#
# Contiene SOLO el modelo de tabla SQLModel.
# Los schemas Pydantic de entrada/salida viven en schemas.py.
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from app.modules.producto.links import ProductoCategoria

if TYPE_CHECKING:
    from app.modules.producto.models import Producto


class Categoria(SQLModel, table=True):
    __tablename__ = "categorias"

    id: Optional[int] = Field(default=None, primary_key=True)
    parent_id: Optional[int] = Field(default=None, foreign_key="categorias.id")
    nombre: str = Field(unique=True, nullable=False)
    descripcion: str
    imagen_url: str
    is_active: bool = Field(default=True)

    parent: Optional["Categoria"] = Relationship(
        back_populates="children",
        sa_relationship_kwargs={"remote_side": "Categoria.id"}
    )

    children: List["Categoria"] = Relationship(
        back_populates="parent"
    )

    # Relacion N:N con Producto via tabla intermedia
    productos: List["Producto"] = Relationship(
        back_populates="categorias",
        link_model=ProductoCategoria,
        sa_relationship_kwargs={"overlaps": "producto,categoria"}
    )