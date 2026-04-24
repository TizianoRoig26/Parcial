# app/modules/ingerediente/models.py
#
# Contiene SOLO el modelo de tabla SQLModel (Hero).
# Los schemas Pydantic de entrada/salida viven en schemas.py.
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from app.modules.producto.links import ProductoIngrediente

if TYPE_CHECKING:
    from app.modules.producto.models import Producto


class Ingrediente(SQLModel, table=True):
    __tablename__ = "ingredientes"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field (unique=True, nullable=False)
    descripcion: str = Field (max_length=500)
    es_alergeno: bool = Field (default=False, nullable=False)
    is_active: bool  = Field (default=True)

    productos: list["Producto"] = Relationship(
        back_populates="ingredientes",
        link_model=ProductoIngrediente
    )


