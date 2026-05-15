
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.producto.models import Producto


class UnidadMedida(SQLModel, table=True):
    __tablename__ = "unidad_medidas"

    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, nullable=False)
    simbolo: str = Field(unique=True, nullable=False)
    tipo: str = Field(nullable=False)
    is_active: bool = Field(default=True)

    productos: List["Producto"] = Relationship(back_populates="unidad_medida")