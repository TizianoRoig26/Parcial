
from fastapi import APIRouter, Depends, Query, status
from typing import Annotated
from sqlmodel import Session

from app.core.database import get_session
from app.core.deps import require_role
from app.modules.categoria.schemas import CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList
from app.modules.categoria.service import CategoriaService
from app.modules.usuario.model import Usuario

router = APIRouter()


def get_Categoria_service(session: Session = Depends(get_session)) -> CategoriaService:
    return CategoriaService(session)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/",
    response_model=CategoriaPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Crear un Categoria",
)
def create_categoria(
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    data: CategoriaCreate,
    svc: CategoriaService = Depends(get_Categoria_service),
) -> CategoriaPublic:
    """Router delega al servicio — sin lógica de negocio aquí."""
    return svc.create(data)


@router.get(
    "/",
    response_model=CategoriaList,
    summary="Listar Categoria activos (paginado)",
)
def list_categoria(
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    svc: CategoriaService = Depends(get_Categoria_service),
) -> CategoriaList:
    return svc.get_all(offset=offset, limit=limit)



@router.get(
    "/{id}",
    response_model=CategoriaPublic,
    summary="Obtener Categoria por ID",
)
def get_categoria(
    id: int,
    svc: CategoriaService = Depends(get_Categoria_service),
) -> CategoriaPublic:
    return svc.get_by_id(id)


@router.patch(
    "/{id}",
    response_model=CategoriaPublic,
    summary="Actualizacion parcial de Categoria",
)
def update_Categoria(
    id: int,
    rol: Annotated[Usuario, Depends(require_role(["ADMIN","STOCK"]))],
    data: CategoriaUpdate,
    svc: CategoriaService = Depends(get_Categoria_service),
) -> CategoriaPublic:
    return svc.update(id, data)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete de Categoria",
)
def delete_categoria(
    id: int,
    rol: Annotated[Usuario, Depends(require_role(["ADMIN"]))],
    svc: CategoriaService = Depends(get_Categoria_service),
) -> None:
    svc.soft_delete(id)
    
@router.get("/search/", response_model=list[CategoriaPublic], summary="Buscar categorias por nombre")
def search_categorias(
    alias: str = Query(..., min_length=1),
    svc: CategoriaService = Depends(get_Categoria_service),
) -> list[CategoriaPublic]:
    return svc.search_by_nombre(alias)
