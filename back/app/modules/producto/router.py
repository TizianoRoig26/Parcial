# app/modules/producto/router.py
from fastapi import APIRouter, Depends, Query, status
from typing import Annotated
from sqlmodel import Session

from app.core.database import get_session
from app.modules.producto.schemas import ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList, CategoriaAssign, IngredienteAssign
from app.modules.ingerediente.schemas import IngredientePublic
from app.modules.producto.service import ProductoService

router = APIRouter()


def get_Producto_service(session: Session = Depends(get_session)) -> ProductoService:
    """Factory de dependencia: inyecta el servicio con su Session."""
    return ProductoService(session)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=ProductoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un Producto",
)
def create_producto(
    data: ProductoCreate,
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoPublic:
    """Router delega al servicio — sin lógica de negocio aquí."""
    return svc.create(data)


@router.get(
    "/",
    response_model=ProductoList,
    summary="Listar productos activos (paginado)",
)
def list_productos(
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoList:
    return svc.get_all(offset=offset, limit=limit)



@router.get(
    "/{id}",
    response_model=ProductoPublic,
    summary="Obtener Producto por ID",
)
def get_producto(
    id: int,
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoPublic:
    return svc.get_by_id(id)


@router.patch(
    "/{id}",
    response_model=ProductoPublic,
    summary="Actualizacion parcial de Producto",
)
def update_producto(
    id: int,
    data: ProductoUpdate,
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoPublic:

    return svc.update(id, data)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de Producto",
)
def delete_producto(
    id: int,
    svc: ProductoService = Depends(get_Producto_service),
) -> None:
    svc.soft_delete(id)


@router.get(
    "/{id}/ingredientes",
    response_model=list[IngredientePublic],
    summary="Listar ingredientes de un Producto",
)
def list_producto_ingredientes(
    id: int,
    svc: ProductoService = Depends(get_Producto_service),
) -> list[IngredientePublic]:
    return svc.get_ingredientes(id)


@router.post("/{producto_id}/categorias")

def assign_categorias(
    producto_id: int,
    data: CategoriaAssign,
    svc: ProductoService = Depends(get_Producto_service),
):
    return svc.assign_category(producto_id, data.categoria_ids)

@router.post("/{producto_id}/ingredientes")

def assign_ingredientes(
    producto_id: int,
    data: IngredienteAssign,
    svc: ProductoService = Depends(get_Producto_service),
):
    return svc.assign_ingrediente(producto_id, data.ingrediente_ids)