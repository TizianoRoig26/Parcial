from fastapi import Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.unit_of_work import UnitOfWork
from app.modules.pedido.repository import (
	DetallePedidoRepository,
	EstadoPedidoRepository,
	HistorialEstadoPedidoRepository,
	PedidoRepository,
	FormaPagoRepository,
)
from app.modules.direccion.repository import DireccionRepository
from app.modules.producto.repository import ProductoRepository
from app.modules.ingerediente.repository import IngredienteRepository


class PedidosUnitOfWork(UnitOfWork):

	def __init__(self, session: Session) -> None:
		super().__init__(session)
		self.pedidos = PedidoRepository(session)
		self.estados_pedido = EstadoPedidoRepository(session)
		self.historial_estados_pedido = HistorialEstadoPedidoRepository(session)
		self.detalles_pedido = DetallePedidoRepository(session)
		self.formas_pago = FormaPagoRepository(session)
		self.direcciones = DireccionRepository(session)
		self.productos = ProductoRepository(session)
		self.ingredientes = IngredienteRepository(session)


def get_uow(session: Session = Depends(get_session)) -> PedidosUnitOfWork:
	return PedidosUnitOfWork(session)
