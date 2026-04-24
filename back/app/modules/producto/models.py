# app/modules/producto/models.py
#
# Contiene SOLO el modelo de tabla SQLModel (Hero).
# Los schemas Pydantic de entrada/salida viven en schemas.py.
from typing import Optional, Annotated, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from app.modules.producto.links import ProductoCategoria, ProductoIngrediente

if TYPE_CHECKING:
    from app.modules.categoria.models import Categoria
    from app.modules.ingerediente.models import Ingrediente


class Producto(SQLModel, table=True):
    __tablename__ = "productos"

    id: Annotated[Optional[int], Field(default=None, primary_key=True)]
    nombre: str
    descripcion: str
    precio_base: int
    stock_cantidad: Annotated[int, Field(default=0)]
    imagen_url: str
    is_active: Annotated[bool, Field(default=True)]

    # Relacion N:N con Categoria via tabla intermedia
    categorias: List["Categoria"] = Relationship(
        back_populates="productos",
        link_model=ProductoCategoria,
        sa_relationship_kwargs={"overlaps": "producto,categoria"}
    )


    # Relacion N:N con Ingrediente via tabla intermedia
    ingredientes: List["Ingrediente"] = Relationship(
        back_populates="productos",
        link_model=ProductoIngrediente,
        sa_relationship_kwargs={"overlaps": "producto,ingrediente"}
    )