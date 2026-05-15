
from fastapi import APIRouter, Depends, Query, status
from typing import Annotated
from sqlmodel import Session

from app.core.database import get_session
from app.modules.unidadMedida.schemas import UnidadMedidaCreate, UnidadMedidaPublic, UnidadMedidaUpdate, UnidadMedidaList
from app.modules.unidadMedida.service import UnidadMedidaService

router = APIRouter()


def get_unidadMedida_service(session: Session = Depends(get_session)) -> UnidadMedidaService:
    return UnidadMedidaService(session)


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.get(
    "/",
    response_model=UnidadMedidaList,
    summary="Listar Unidad de Medidas activos (paginado)",
)
def list_unidadMedida(
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    svc: UnidadMedidaService = Depends(get_unidadMedida_service),
) -> UnidadMedidaList:
    return svc.get_all(offset=offset, limit=limit)

@router.get(
    "/{id}",
    response_model=UnidadMedidaPublic,
    summary="Obtener Unidad de Medida por ID",
)
def get_unidadMedida(
    id: int,
    svc: UnidadMedidaService = Depends(get_unidadMedida_service),
) -> UnidadMedidaPublic:
    return svc.get_by_id(id)
