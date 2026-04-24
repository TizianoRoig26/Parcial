# app/modules/ingerediente/router.py
from fastapi import APIRouter, Depends, Query, status
from typing import Annotated
from sqlmodel import Session

from app.core.database import get_session
from app.modules.ingerediente.schemas import IngredienteCreate, IngredientePublic, IngredienteUpdate, IngredienteList
from app.modules.ingerediente.service import IngredienteService

router = APIRouter()

def get_ingrediente_service(session: Session = Depends(get_session)) -> IngredienteService:
    """Factory de dependencia: inyecta el servicio con su Session."""
    return IngredienteService(session)

# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=IngredientePublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un Ingrediente",
)
def create_ingrediente(
    data: IngredienteCreate,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredientePublic:
    return svc.create(data)

@router.get(
    "/",
    response_model=IngredienteList,
    summary="Listar ingredientes activos (paginado)",
)
def list_ingredientes(
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredienteList:
    return svc.get_all(offset=offset, limit=limit)


@router.get(
    "/{id}",
    response_model=IngredientePublic,
    summary="Obtener Ingrediente por ID",
)
def get_ingrediente(
    id: int,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredientePublic:
    return svc.get_by_id(id)

@router.patch(
    "/{id}",
    response_model=IngredientePublic,
    summary="Actualizacion parcial de Ingrediente",
)
def update_ingrediente(
    id: int,
    data: IngredienteUpdate,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> IngredientePublic:
    return svc.update(id, data)

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de Ingrediente",
)
def delete_ingrediente(
    id: int,
    svc: IngredienteService = Depends(get_ingrediente_service),
) -> None:
    svc.soft_delete(id)