from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Integer, Numeric, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlmodel import Boolean, Field, SQLModel


class Pedido(SQLModel, table=True):
	__tablename__ = "pedidos"

	__table_args__ = (
		CheckConstraint("total >= 0", name="ck_pedidos_total_nonnegative"),
	)

	id: Optional[int] = Field(default=None, primary_key=True)
	usuario_id: int = Field(foreign_key="usuarios.id", nullable=False, index=True)
	direccion_id: Optional[int] = Field(
		default=None,
		foreign_key="direcciones_entrega.id",
		nullable=True,
		index=True,
	)
	estado_codigo: str = Field(
		foreign_key="estados_pedido.codigo",
		max_length=20,
		nullable=False,
		index=True,
	)
	forma_pago_codigo: str = Field(
		foreign_key="formas_pago.codigo",
		max_length=20,
		nullable=False,
		index=True,
	)
	pagado: bool = Field(
        default=False, 
        sa_column=Column(Boolean, nullable=False, server_default="false")
    )
	subtotal: Decimal = Field(
		sa_column=Column(Numeric(10, 2), nullable=False),
	)
	descuento: Decimal = Field(
		default=Decimal("0.00"),
		sa_column=Column(Numeric(10, 2), nullable=False, server_default="0.00"),
	)
	costo_envio: Decimal = Field(
		default=Decimal("50.00"),
		sa_column=Column(Numeric(10, 2), nullable=False, server_default="50.00"),
	)
	total: Decimal = Field(
		sa_column=Column(Numeric(10, 2), nullable=False),
	)
	notas: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

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


class FormaPago(SQLModel, table=True):
	__tablename__ = "formas_pago"

	codigo: str = Field(primary_key=True, max_length=20)
	descripcion: str = Field(max_length=80, nullable=False)
	habilitado: bool = Field(default=True, nullable=False)

 
class EstadoPedido(SQLModel, table=True):
	__tablename__ = "estados_pedido"

	codigo: str = Field(primary_key=True, max_length=20)
	descripcion: str = Field(max_length=80, nullable=False)
	orden: int = Field(nullable=False, index=True)
	es_terminal: bool = Field(nullable=False, default=False)


class HistorialEstadoPedido(SQLModel, table=True):
	__tablename__ = "historial_estados_pedido"

	id: Optional[int] = Field(default=None, primary_key=True)
	pedido_id: int = Field(
		sa_column=Column(
			Integer,
			ForeignKey("pedidos.id", ondelete="CASCADE"),
			nullable=False,
			index=True,
		),
	)
	estado_desde: Optional[str] = Field(default=None, foreign_key="estados_pedido.codigo", max_length=20)
	estado_hacia: str = Field(foreign_key="estados_pedido.codigo", max_length=20, nullable=False, index=True)
	usuario_id: Optional[int] = Field(default=None, foreign_key="usuarios.id", nullable=True, index=True)
	motivo: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))

	created_at: Optional[datetime] = Field(
		default=None,
		sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
	)


class DetallePedido(SQLModel, table=True):
	__tablename__ = "detalles_pedido"

	__table_args__ = (
		CheckConstraint("cantidad >= 1", name="ck_detalles_pedido_cantidad_min"),
		CheckConstraint("precio_snapshot >= 0", name="ck_detalles_pedido_precio_snapshot_nonnegative"),
		CheckConstraint("subtotal_snap >= 0", name="ck_detalles_pedido_subtotal_snap_nonnegative"),
	)

	pedido_id: int = Field(
		sa_column=Column(
			Integer,
			ForeignKey("pedidos.id", ondelete="CASCADE"),
			primary_key=True,
			nullable=False,
		),
	)
	producto_id: int = Field(
		sa_column=Column(
			Integer,
			ForeignKey("productos.id", ondelete="RESTRICT"),
			primary_key=True,
			nullable=False,
		),
	)
	cantidad: int = Field(sa_column=Column(Integer, nullable=False))

	nombre_snapshot: str = Field(sa_column=Column(Text, nullable=False))
	precio_snapshot: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
	subtotal_snap: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
	personalizacion: Optional[list[int]] = Field(default=None, sa_column=Column(ARRAY(Integer), nullable=True))

	created_at: Optional[datetime] = Field(
		default=None,
		sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
	)


