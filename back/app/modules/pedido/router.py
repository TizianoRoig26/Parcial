from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from app.core.deps import get_current_active_user, require_role
from app.modules.pedido.schemas import PedidoCreate, PedidoEstadoUpdate, PedidoList, PedidoPublic, DetallePedidoPublic
from app.modules.pedido.service import PedidoService
from app.modules.pedido.unit_of_work import PedidosUnitOfWork, get_uow
from app.modules.usuario.model import Usuario

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

