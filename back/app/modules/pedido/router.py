from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from app.core.deps import get_current_active_user, require_role
from app.modules.pedido.schemas import PedidoCreate, PedidoEstadoUpdate, PedidoList, PedidoPublic, DetallePedidoPublic
from app.modules.pedido.service import PedidoService
from app.modules.pedido.unit_of_work import PedidosUnitOfWork, get_uow
from app.modules.usuario.model import Usuario
from fastapi import HTTPException
from fastapi import status

router = APIRouter()


def get_pedido_service(uow: PedidosUnitOfWork = Depends(get_uow)) -> PedidoService:
	return PedidoService(uow)


@router.post(
	"/",
	response_model=PedidoPublic,
	status_code=status.HTTP_201_CREATED,
	summary="Crear pedido",
)
def create_pedido(
	data: PedidoCreate,
	current_user: Annotated[Usuario, Depends(get_current_active_user)],
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	return svc.create(data, usuario_id=current_user.id)


@router.get(
	"/",
	response_model=PedidoList,
	summary="Listar pedidos para el panel de administracion",
	dependencies=[Depends(require_role(["ADMIN", "PEDIDOS"]))],
)
def list_pedidos(
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoList:
	return svc.get_all()


@router.get(
	"/mis-pedidos",
	response_model=PedidoList,
	summary="Listar mis pedidos (usuario autenticado)",
)
def get_mis_pedidos(
	current_user: Annotated[Usuario, Depends(get_current_active_user)],
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoList:
	return svc.get_mis_pedidos(usuario_id=current_user.id)


@router.get(
	"/{id}",
	response_model=PedidoPublic,
	summary="Obtener pedido por ID",
	dependencies=[Depends(require_role(["ADMIN", "PEDIDOS"]))],
)
def get_pedido(
	id: int,
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	return svc.get_by_id(id)


@router.patch(
	"/{id}/estado",
	response_model=PedidoPublic,
	summary="Avanzar estado del pedido",
)
def avanzar_estado_pedido(
	id: int,
	data: PedidoEstadoUpdate,
	current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	return PedidoPublic.model_validate(
		svc.avanzar_estado(
			pedido_id=id,
			data=data,
			usuario_id=current_user.id,
			roles_usuario=current_user.role_codes,
		)
	)


@router.post(
	"/{id}/cancel",
	response_model=PedidoPublic,
	summary="Cancelar pedido (usuario)",
)
def cancelar_pedido_usuario(
 	id: int,
 	data: PedidoEstadoUpdate,
 	current_user: Annotated[Usuario, Depends(get_current_active_user)],
 	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	if data.estado_hacia != "CANCELADO":
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El estado objetivo debe ser 'CANCELADO'")
	return PedidoPublic.model_validate(
		svc.cancelar_por_usuario(pedido_id=id, motivo=data.motivo, usuario_id=current_user.id)
	)


@router.post(
	"/{id}/cancel-admin",
	response_model=PedidoPublic,
	summary="Cancelar pedido (admin)",
	dependencies=[Depends(require_role(["ADMIN", "PEDIDOS"]))],
)
def cancelar_pedido_admin(
 	id: int,
 	data: PedidoEstadoUpdate,
 	current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
 	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	if data.estado_hacia != "CANCELADO":
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El estado objetivo debe ser 'CANCELADO'")
	return PedidoPublic.model_validate(
		svc.cancelar_por_admin(pedido_id=id, motivo=data.motivo, usuario_id=current_user.id)
	)


@router.get(
	"/{id}/detalles",
	response_model=list[DetallePedidoPublic],
	summary="Obtener detalles (items) de un pedido",
)
def get_pedido_detalles(
	id: int,
	svc: PedidoService = Depends(get_pedido_service),
) -> list[DetallePedidoPublic]:
	return svc.get_detalles_por_pedido(id)

