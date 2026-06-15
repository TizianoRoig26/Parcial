from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlmodel import Field, SQLModel


class ItemPedidoRequest(SQLModel):
	personalizacion: Optional[list[int]] = Field(default=None)


class ItemPedidoCreate(SQLModel):
	producto_id: int = Field(ge=1)
	cantidad: int = Field(ge=1)
	personalizacion: Optional[list[int]] = Field(default=None)


class PedidoCreate(SQLModel):
	direccion_id: Optional[int] = Field(default=None, ge=1)
	forma_pago_codigo: str = Field(max_length=20)
	notas: Optional[str] = None
	items: list[ItemPedidoCreate]


class PedidoEstadoUpdate(SQLModel):
	estado_hacia: str = Field(max_length=20)
	motivo: Optional[str] = None


class PedidoPublic(SQLModel):
	id: int
	usuario_id: int
	direccion_id: Optional[int] = None
	estado_codigo: str
	forma_pago_codigo: str
	subtotal: Decimal
	descuento: Decimal
	costo_envio: Decimal
	total: Decimal
	pagado: bool
	notas: Optional[str] = None
	created_at: datetime
	updated_at: datetime
	deleted_at: Optional[datetime] = None


class PedidoList(SQLModel):
	data: list[PedidoPublic]
	total: int

class DetallePedidoPublic(SQLModel):
	pedido_id: int
	producto_id: int
	cantidad: int
	nombre_snapshot: str
	precio_snapshot: Decimal
	subtotal_snap: Decimal
	personalizacion: Optional[list[int]] = None

class DetallePedidoList(SQLModel):
	data: list[DetallePedidoPublic]
	total: int

