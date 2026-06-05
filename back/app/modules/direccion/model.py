from datetime import datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Column, DateTime, Numeric, Text, func
from sqlmodel import Field, SQLModel, Relationship

if TYPE_CHECKING:
	from app.modules.usuario.model import Usuario


class DireccionEntrega(SQLModel, table=True):
	__tablename__ = "direcciones_entrega"

	id: Optional[int] = Field(default=None, primary_key=True)
	usuario_id: int = Field(foreign_key="usuarios.id", nullable=False, index=True)

	alias: Optional[str] = Field(default=None, max_length=50)
	linea1: str = Field(sa_column=Column(Text, nullable=False))
	linea2: Optional[str] = Field(default=None, sa_column=Column(Text, nullable=True))
	ciudad: str = Field(max_length=100, nullable=False)
	provincia: Optional[str] = Field(default=None, max_length=100)
	codigo_postal: Optional[str] = Field(default=None, max_length=10)

	es_principal: bool = Field(default=False, nullable=False)

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

	usuario: Optional["Usuario"] = Relationship(back_populates="direcciones")
