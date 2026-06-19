from sqlmodel import Session, select, func, text

from app.core.repository import BaseRepository
from app.modules.pedido.models import DetallePedido, EstadoPedido, FormaPago, HistorialEstadoPedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
	def __init__(self, session: Session) -> None:
		super().__init__(session, Pedido)

	def get_by_usuario_id(self, usuario_id: int) -> list[Pedido]:
		return list(
			self.session.exec(
				select(Pedido).where(Pedido.usuario_id == usuario_id)
			).all()
		)

	def get_by_estado_codigo(self, estado_codigo: str) -> list[Pedido]:
		return list(
			self.session.exec(
				select(Pedido).where(Pedido.estado_codigo == estado_codigo)
			).all()
		)

	def get_all(self) -> list[Pedido]:
		return list(
			self.session.exec(
				select(Pedido)
				.order_by(Pedido.created_at.desc(), Pedido.updated_at.desc())
			).all()
		)

	def count(self) -> int:
		return self.session.exec(
			select(func.count(Pedido.id)).where(Pedido.deleted_at == None)
		).one()


class EstadoPedidoRepository(BaseRepository[EstadoPedido]):
	def __init__(self, session: Session) -> None:
		super().__init__(session, EstadoPedido)

	def get_by_codigo(self, codigo: str) -> EstadoPedido | None:
		return self.session.exec(
			select(EstadoPedido).where(EstadoPedido.codigo == codigo)
		).first()


class FormaPagoRepository(BaseRepository[FormaPago]):
	def __init__(self, session: Session) -> None:
		super().__init__(session, FormaPago)

	def get_by_codigo(self, codigo: str) -> FormaPago | None:
		return self.session.exec(
			select(FormaPago).where(FormaPago.codigo == codigo)
		).first()


class HistorialEstadoPedidoRepository(BaseRepository[HistorialEstadoPedido]):
	def __init__(self, session: Session) -> None:
		super().__init__(session, HistorialEstadoPedido)

	def get_by_pedido(self, pedido_id: int) -> list[HistorialEstadoPedido]:
		return list(
			self.session.exec(
				select(HistorialEstadoPedido)
				.where(HistorialEstadoPedido.pedido_id == pedido_id)
				.order_by(HistorialEstadoPedido.created_at.asc(), HistorialEstadoPedido.id.asc())
			).all()
		)

	def get_ultimo_por_pedido(self, pedido_id: int) -> HistorialEstadoPedido | None:
		return self.session.exec(
			select(HistorialEstadoPedido)
			.where(HistorialEstadoPedido.pedido_id == pedido_id)
			.order_by(HistorialEstadoPedido.created_at.desc(), HistorialEstadoPedido.id.desc())
		).first()

	def update(self, entity: HistorialEstadoPedido) -> HistorialEstadoPedido:
		raise NotImplementedError("HistorialEstadoPedido es append-only")

	def delete(self, entity: HistorialEstadoPedido) -> None:
		raise NotImplementedError("HistorialEstadoPedido es append-only")


class DetallePedidoRepository(BaseRepository[DetallePedido]):
	def __init__(self, session: Session) -> None:
		super().__init__(session, DetallePedido)

	def get_by_pedido(self, pedido_id: int) -> list[DetallePedido]:
		return list(
			self.session.exec(
				select(DetallePedido).where(DetallePedido.pedido_id == pedido_id)
			).all()
		)

	def get_by_pedido_y_producto(self, pedido_id: int, producto_id: int) -> DetallePedido | None:
		return self.session.exec(
			select(DetallePedido).where(
				DetallePedido.pedido_id == pedido_id,
				DetallePedido.producto_id == producto_id,
			)
		).first()

	def update(self, entity: DetallePedido) -> DetallePedido:
		raise NotImplementedError("DetallePedido es inmutable")

	def delete(self, entity: DetallePedido) -> None:
		raise NotImplementedError("DetallePedido es inmutable")
