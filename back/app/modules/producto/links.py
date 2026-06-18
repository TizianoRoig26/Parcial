
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from decimal import Decimal
from sqlalchemy import Column, Numeric
from pydantic import model_validator

if TYPE_CHECKING:
    from app.modules.producto.models import Producto
    from app.modules.ingerediente.models import Ingrediente
    from app.modules.categoria.models import Categoria
    from app.modules.unidadMedida.models import UnidadMedida


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
    cantidad: Decimal = Field(
        default=Decimal("1.00"),
        sa_column=Column(Numeric(10, 2), nullable=False, server_default="1.00")
    )
    unidad_medida_id: Optional[int] = Field(
        default=None, foreign_key="unidad_medidas.id", nullable=True
    )

    producto: Optional["Producto"] = Relationship()
    ingrediente: Optional["Ingrediente"] = Relationship()
    unidad_medida: Optional["UnidadMedida"] = Relationship()

    @model_validator(mode="before")
    @classmethod
    def handle_cantidad_requerida(cls, data):
        if isinstance(data, dict):
            if "cantidad_requerida" in data and "cantidad" not in data:
                data["cantidad"] = data["cantidad_requerida"]
        return data

    @property
    def cantidad_requerida(self) -> Decimal:
        return self.cantidad

    @cantidad_requerida.setter
    def cantidad_requerida(self, value: Decimal):
        self.cantidad = value


