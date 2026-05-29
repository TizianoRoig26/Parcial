from anyio.from_thread import run as run_from_thread
from collections.abc import Iterable
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status

from app.core.websocket import manager
from app.modules.pedido.models import DetallePedido, HistorialEstadoPedido, Pedido
from app.modules.pedido.schemas import PedidoCreate, PedidoEstadoUpdate, PedidoList, PedidoPublic
from app.modules.pedido.unit_of_work import PedidosUnitOfWork


class PedidoService:
	TRANSICIONES: dict[str, set[str]] = {
		"PENDIENTE": {"CONFIRMADO", "CANCELADO"},
		"CONFIRMADO": {"EN_PREP", "CANCELADO"},
		"EN_PREP": {"EN_CAMINO", "CANCELADO"},
		"EN_CAMINO": {"ENTREGADO"},
		"ENTREGADO": set(),
		"CANCELADO": set(),
	}
	ESTADOS_TERMINALES = {"ENTREGADO", "CANCELADO"}
	ROLES_PARA_CANCELAR_DESDE_EN_PREP = {"ADMIN", "PEDIDOS"}
	MONEDA = Decimal("0.01")
	COSTO_ENVIO_DOMICILIO = Decimal("50.00")
	COSTO_ENVIO_RETIRO = Decimal("0.00")

	EVENTOS_WS = {
		"CONFIRMADO": "PEDIDO_CONFIRMADO",
		"EN_PREP": "PEDIDO_EN_PREPARACION",
		"EN_CAMINO": "PEDIDO_EN_CAMINO",
		"ENTREGADO": "PEDIDO_ENTREGADO",
		"CANCELADO": "PEDIDO_CANCELADO",
	}

	def __init__(self, uow: PedidosUnitOfWork) -> None:
		self.uow = uow

	def _emitir_evento_ws(self, event_type: str | None, pedido: PedidoPublic) -> None:
		if not event_type:
			return

		try:
			run_from_thread(manager.broadcast, event_type, pedido.model_dump(mode="json"))
		except RuntimeError:
			return

	@staticmethod
	def _moneda(value: Decimal | int | float) -> Decimal:
		return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

	@classmethod
	def validar_transicion_estado(
		cls,
		estado_desde: str,
		estado_hacia: str,
		*,
		roles_usuario: Iterable[str] | None = None,
		motivo: str | None = None,
	) -> None:
		if estado_desde not in cls.TRANSICIONES:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"Estado origen '{estado_desde}' no reconocido",
			)

		if estado_hacia not in cls.TRANSICIONES:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"Estado destino '{estado_hacia}' no reconocido",
			)

		if estado_hacia not in cls.TRANSICIONES[estado_desde]:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"Transición no permitida: {estado_desde} -> {estado_hacia}",
			)

		if estado_desde in cls.ESTADOS_TERMINALES:
			raise HTTPException(
				status_code=status.HTTP_400_BAD_REQUEST,
				detail=f"El estado '{estado_desde}' es terminal y no admite transiciones",
			)

		if estado_hacia == "CANCELADO":
			if not motivo or not motivo.strip():
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="El motivo es obligatorio cuando el estado destino es CANCELADO",
				)

			if estado_desde == "EN_PREP":
				roles = set(roles_usuario or [])
				if roles.isdisjoint(cls.ROLES_PARA_CANCELAR_DESDE_EN_PREP):
					raise HTTPException(
						status_code=status.HTTP_403_FORBIDDEN,
						detail="Solo ADMIN o PEDIDOS pueden cancelar un pedido en EN_PREP",
					)

	@classmethod
	def es_terminal(cls, estado_codigo: str) -> bool:
		return estado_codigo in cls.ESTADOS_TERMINALES

	def avanzar_estado(
		self,
		pedido_id: int,
		data: PedidoEstadoUpdate,
		*,
		usuario_id: int | None = None,
		roles_usuario: Iterable[str] | None = None,
	) -> PedidoPublic:
		with self.uow:
			pedido = self.uow.pedidos.get_by_id(pedido_id)
			if not pedido:
				raise HTTPException(
					status_code=status.HTTP_404_NOT_FOUND,
					detail=f"Pedido con id={pedido_id} no encontrado",
				)

			estado_desde = pedido.estado_codigo
			self.validar_transicion_estado(
				estado_desde,
				data.estado_hacia,
				roles_usuario=roles_usuario,
				motivo=data.motivo,
			)

			pedido.estado_codigo = data.estado_hacia
			self.uow.pedidos.update(pedido)

			historial = HistorialEstadoPedido(
				pedido_id=pedido.id,
				estado_desde=estado_desde,
				estado_hacia=data.estado_hacia,
				usuario_id=usuario_id,
				motivo=data.motivo,
			)
			self.uow.historial_estados_pedido.add(historial)

			resultado = PedidoPublic.model_validate(pedido)

		event_type = self.EVENTOS_WS.get(data.estado_hacia)
		self._emitir_evento_ws(event_type, resultado)
		return resultado

	def create(self, data: PedidoCreate, *, usuario_id: int) -> PedidoPublic:
		with self.uow:
			if not data.items:
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="El pedido debe incluir al menos un item",
				)
    
			estado_pendiente = self.uow.estados_pedido.get_by_codigo("PENDIENTE")
   
			forma_pago = self.uow.formas_pago.get_by_codigo(data.forma_pago_codigo)
			if not forma_pago or not forma_pago.habilitado:
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail=f"Forma de pago '{data.forma_pago_codigo}' no disponible",
				)

			direccion = None
			if data.direccion_id is not None:
				direccion = self.uow.direcciones.get_by_id_and_usuario(data.direccion_id, usuario_id)
				if not direccion:
					raise HTTPException(
						status_code=status.HTTP_404_NOT_FOUND,
						detail=f"Dirección con id={data.direccion_id} no encontrada para el usuario",
					)
			elif forma_pago.codigo != "EFECTIVO":
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="La dirección es obligatoria para esta forma de pago",
				)

			items_normalizados: dict[int, dict[str, object]] = {}
			for item in data.items:
				personalizacion = sorted(set(item.personalizacion or [])) or None
				existente = items_normalizados.get(item.producto_id)
				if existente is None:
					items_normalizados[item.producto_id] = {
						"cantidad": item.cantidad,
						"personalizacion": personalizacion,
					}
					continue

				existente["cantidad"] = int(existente["cantidad"]) + item.cantidad

			subtotal = Decimal("0.00")
			detalle_rows: list[DetallePedido] = []

			for producto_id, payload in items_normalizados.items():
				producto = self.uow.productos.get_active_by_id(producto_id)
				if not producto:
					raise HTTPException(
						status_code=status.HTTP_404_NOT_FOUND,
						detail=f"Producto con id={producto_id} no encontrado o inactivo",
					)

				personalizacion = payload["personalizacion"]
				cantidad = int(payload["cantidad"])
				relaciones = self.uow.productos.get_ingrediente_relaciones(producto_id)
				removibles = {rel.ingrediente_id for rel in relaciones if rel.es_removible}

				if producto.stock_cantidad is None:
					producto.stock_cantidad = 0
				if producto.stock_cantidad < cantidad:
					raise HTTPException(
						status_code=status.HTTP_400_BAD_REQUEST,
						detail=(
							f"Stock insuficiente para producto id={producto_id}. "
							f"Disponible={producto.stock_cantidad}, pedido={cantidad}"
						),
					)
				producto.stock_cantidad = int(producto.stock_cantidad) - cantidad
				self.uow.productos.update(producto)

				if personalizacion:
					for ingrediente_id in personalizacion:
						ingrediente = self.uow.ingredientes.get_by_id(ingrediente_id)
						if ingrediente_id not in removibles:
							raise HTTPException(
								status_code=status.HTTP_400_BAD_REQUEST,
								detail=(
									f"El ingrediente id={ingrediente_id} no es removible para el producto "
									f"id={producto_id}"
								),
							)

				precio_snapshot = self._moneda(producto.precio_base)
				subtotal_snap = self._moneda(precio_snapshot * cantidad)
				subtotal += subtotal_snap

				detalle_rows.append(
					DetallePedido(
						pedido_id=0,
						producto_id=producto.id,
						cantidad=cantidad,
						nombre_snapshot=producto.nombre,
						precio_snapshot=precio_snapshot,
						subtotal_snap=subtotal_snap,
						personalizacion=personalizacion,
					)
				)

			descuento = self._moneda(Decimal("0.00"))
			costo_envio = self.COSTO_ENVIO_RETIRO if data.direccion_id is None else self.COSTO_ENVIO_DOMICILIO
			total = self._moneda(subtotal - descuento + costo_envio)
			if total < Decimal("0.00"):
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="El total del pedido no puede ser negativo",
				)

			pedido = Pedido(
				usuario_id=usuario_id,
				direccion_id=data.direccion_id,
				estado_codigo=estado_pendiente.codigo,
				forma_pago_codigo=forma_pago.codigo,
				subtotal=subtotal,
				descuento=descuento,
				costo_envio=costo_envio,
				total=total,
				notas=data.notas,
			)
			self.uow.pedidos.add(pedido)

			for detalle in detalle_rows:
				detalle.pedido_id = pedido.id
				self.uow.detalles_pedido.add(detalle)

			historial = HistorialEstadoPedido(
				pedido_id=pedido.id,
				estado_desde=None,
				estado_hacia=estado_pendiente.codigo,
				usuario_id=usuario_id,
				motivo="Pedido creado",
			)
			self.uow.historial_estados_pedido.add(historial)

			resultado = PedidoPublic.model_validate(pedido)

		self._emitir_evento_ws("PEDIDO_CREADO", resultado)
		return resultado

	def get_by_id(self, pedido_id: int) -> PedidoPublic:
		with self.uow:
			pedido = self.uow.pedidos.get_by_id(pedido_id)
			if not pedido:
				raise HTTPException(
					status_code=status.HTTP_404_NOT_FOUND,
					detail=f"Pedido con id={pedido_id} no encontrado",
				)
			return PedidoPublic.model_validate(pedido)

	def get_mis_pedidos(self, usuario_id: int) -> PedidoList:
		with self.uow:
			pedidos = self.uow.pedidos.get_by_usuario_id(usuario_id)
			return PedidoList(
				data=[PedidoPublic.model_validate(pedido) for pedido in pedidos],
				total=len(pedidos),
			)

	def get_all(self, offset: int = 0, limit: int = 20) -> PedidoList:
		with self.uow:
			pedidos = self.uow.pedidos.get_all()
			total = self.uow.pedidos.count()
			return PedidoList(
				data=[PedidoPublic.model_validate(pedido) for pedido in pedidos],
				total=total,
			)

	def get_detalles_por_pedido(self, pedido_id: int) -> list[DetallePedido]:
		with self.uow:
			pedido = self.uow.pedidos.get_by_id(pedido_id)
			if not pedido:
				raise HTTPException(
					status_code=status.HTTP_404_NOT_FOUND,
					detail=f"Pedido con id={pedido_id} no encontrado",
				)
			return self.uow.detalles_pedido.get_by_pedido(pedido_id)

	def cancelar_por_usuario(self, pedido_id: int, motivo: str | None, *, usuario_id: int) -> PedidoPublic:
	
		with self.uow:
			pedido = self.uow.pedidos.get_by_id(pedido_id)
			if not pedido:
				raise HTTPException(
					status_code=status.HTTP_404_NOT_FOUND,
					detail=f"Pedido con id={pedido_id} no encontrado",
				)

			if pedido.usuario_id != usuario_id:
				raise HTTPException(
					status_code=status.HTTP_403_FORBIDDEN,
					detail="No autorizado para cancelar este pedido",
				)

			if pedido.estado_codigo not in {"PENDIENTE", "CONFIRMADO"}:
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail=(
						"Solo se puede cancelar un pedido desde los estados PENDIENTE o CONFIRMADO"
					),
				)

			if not motivo or not motivo.strip():
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="El motivo es obligatorio al cancelar un pedido",
				)

			estado_desde = pedido.estado_codigo
			pedido.estado_codigo = "CANCELADO"
			self.uow.pedidos.update(pedido)

			historial = HistorialEstadoPedido(
				pedido_id=pedido.id,
				estado_desde=estado_desde,
				estado_hacia="CANCELADO",
				usuario_id=usuario_id,
				motivo=motivo,
			)
			self.uow.historial_estados_pedido.add(historial)

			resultado = PedidoPublic.model_validate(pedido)

		self._emitir_evento_ws("PEDIDO_CANCELADO", resultado)
		return resultado

	def cancelar_por_admin(self, pedido_id: int, motivo: str | None, *, usuario_id: int | None = None) -> PedidoPublic:

		with self.uow:
			pedido = self.uow.pedidos.get_by_id(pedido_id)
			if not pedido:
				raise HTTPException(
					status_code=status.HTTP_404_NOT_FOUND,
					detail=f"Pedido con id={pedido_id} no encontrado",
				)

			if not motivo or not motivo.strip():
				raise HTTPException(
					status_code=status.HTTP_400_BAD_REQUEST,
					detail="El motivo es obligatorio al cancelar un pedido",
				)

			estado_desde = pedido.estado_codigo
			pedido.estado_codigo = "CANCELADO"
			self.uow.pedidos.update(pedido)

			historial = HistorialEstadoPedido(
				pedido_id=pedido.id,
				estado_desde=estado_desde,
				estado_hacia="CANCELADO",
				usuario_id=usuario_id,
				motivo=motivo,
			)
			self.uow.historial_estados_pedido.add(historial)

			resultado = PedidoPublic.model_validate(pedido)

		self._emitir_evento_ws("PEDIDO_CANCELADO", resultado)
		return resultado