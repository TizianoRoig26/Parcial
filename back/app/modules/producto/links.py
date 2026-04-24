# app/modules/producto/links.py
#
# Tablas de enlace (many-to-many) del modulo producto.
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.producto.models import Producto
    from app.modules.ingerediente.models import Ingrediente
    from app.modules.categoria.models import Categoria


class ProductoCategoria(SQLModel, table=True):
    __tablename__ = "productos_categoria"
    producto_id: int = Field(foreign_key="productos.id", primary_key=True)
    categoria_id: int = Field(foreign_key="categorias.id", primary_key=True)

    producto: Optional["Producto"] = Relationship()
    categoria: Optional["Categoria"] = Relationship()



class ProductoIngrediente(SQLModel, table=True):
    __tablename__ = "productos_ingredientes"
    producto_id: int = Field(foreign_key="productos.id", primary_key=True)
    ingrediente_id: int = Field(foreign_key="ingredientes.id", primary_key=True)
    es_removible: bool = Field(default=False)

    producto: Optional["Producto"] = Relationship()
    ingrediente: Optional["Ingrediente"] = Relationship()

