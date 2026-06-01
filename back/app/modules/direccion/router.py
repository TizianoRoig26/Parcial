from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import HTMLResponse
from sqlmodel import Session

from app.core.database import get_session, engine
from app.core.deps import get_current_active_user

from app.modules.direccion.schemas import (
    DireccionCreate,
    DireccionList,
    DireccionPublic,
    DireccionUpdate,
)
from app.modules.direccion.service import DireccionService
from app.modules.usuario.model import Usuario

router = APIRouter()


def get_direccion_service(session: Session = Depends(get_session)) -> DireccionService:
    return DireccionService(session)


@router.post(
    "/",
    response_model=DireccionPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una Direccion de Entrega",
)
def create_direccion(
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    data: DireccionCreate,
    svc: DireccionService = Depends(get_direccion_service),
) -> DireccionPublic:
    return svc.create(current_user.id, data)


@router.get(
    "/",
    response_model=DireccionList,
    summary="Listar direcciones activas del usuario (paginado)",
)
def list_direcciones(
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    svc: DireccionService = Depends(get_direccion_service),
) -> DireccionList:
    return svc.get_all(usuario_id=current_user.id, offset=offset, limit=limit)


@router.get(
    "/alias",
    response_model=DireccionList,
    summary="Obtener direcciones por alias",
)
def get_direccion_by_alias(
    alias: str,
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    svc: DireccionService = Depends(get_direccion_service),
) -> DireccionList:
    return svc.get_by_alias_and_usuario(alias=alias, usuario_id=current_user.id)


@router.get(
    "/{id}",
    response_model=DireccionPublic,
    summary="Obtener Direccion por ID",
)
def get_direccion(
    id: int,
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    svc: DireccionService = Depends(get_direccion_service),
) -> DireccionPublic:
    return svc.get_by_id(direccion_id=id, usuario_id=current_user.id)


@router.patch(
    "/{id}",
    response_model=DireccionPublic,
    summary="Actualizacion parcial de Direccion",
)
def update_direccion(
    id: int,
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    data: DireccionUpdate,
    svc: DireccionService = Depends(get_direccion_service),
) -> DireccionPublic:
    return svc.update(direccion_id=id, usuario_id=current_user.id, data=data)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de Direccion",
)
def delete_direccion(
    id: int,
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    svc: DireccionService = Depends(get_direccion_service),
) -> None:
    svc.soft_delete(direccion_id=id, usuario_id=current_user.id)
