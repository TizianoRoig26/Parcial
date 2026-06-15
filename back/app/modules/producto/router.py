
from fastapi import APIRouter, Depends, Query, status
from typing import Annotated
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import get_current_active_user, require_role
from app.modules.producto.schemas import ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList, CategoriaAssign, IngredienteAssign
from app.modules.ingerediente.schemas import IngredientePublic
from app.modules.producto.service import ProductoService
from app.modules.usuario.model import Usuario

router = APIRouter()


def get_Producto_service(session: Session = Depends(get_session)) -> ProductoService:
    return ProductoService(session)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=ProductoPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un Producto",
)
def create_producto(
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    data: ProductoCreate,
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoPublic:
    return svc.create(data)


@router.get(
    "/",
    response_model=ProductoList,
    summary="Listar productos activos (paginado)",
)
def list_productos(
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    nombre: str | None = Query(None),
    categoria_id: int | None = Query(None),
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoList:
    return svc.get_all(offset=offset, limit=limit, nombre=nombre, categoria_id=categoria_id)



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
    rol: Annotated[Usuario, Depends(require_role(["ADMIN","STOCK"]))],
    data: ProductoUpdate,
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoPublic:
    return svc.update(id, data)


@router.patch(
    "/estado/{id}",
    response_model=ProductoPublic,
    summary="Actualizacion del estado de un Producto",
)
def change_state_producto(
    id: int,
    rol: Annotated[Usuario, Depends(require_role(["ADMIN","STOCK"]))],
    svc: ProductoService = Depends(get_Producto_service),
) -> ProductoPublic:
    return svc.change_state(id)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de Producto",
)
def delete_producto(
    id: int,
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
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
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    svc: ProductoService = Depends(get_Producto_service),
) -> list[IngredientePublic]:
    return svc.get_ingredientes(id)


@router.post("/{producto_id}/categorias")

def assign_categorias(
    producto_id: int,
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    data: CategoriaAssign,
    svc: ProductoService = Depends(get_Producto_service),
):
    return svc.assign_category(producto_id, data.categoria_ids)

@router.post("/{producto_id}/ingredientes")

def assign_ingredientes(
    producto_id: int,
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    data: IngredienteAssign,
    svc: ProductoService = Depends(get_Producto_service),
):
    return svc.assign_ingrediente(producto_id, data.ingrediente_ids)

@router.get("/search/", response_model=list[ProductoPublic])
def search_productos(
    alias: str = Query(..., min_length=1),
    svc: ProductoService = Depends(get_Producto_service),
) -> list[ProductoPublic]:
    return svc.search_by_nombre(alias)