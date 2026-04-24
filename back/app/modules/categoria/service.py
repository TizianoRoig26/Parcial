# app/modules/categoria/service.py
from fastapi import HTTPException, status
from sqlmodel import Session

from app.modules.categoria.unit_of_work import CategoriaUnitOfWork
from app.modules.categoria.models import Categoria
from app.modules.categoria.schemas import CategoriaCreate, CategoriaPublic, CategoriaUpdate, CategoriaList

class CategoriaService:
    """
    Capa de lógica de negocio para Categoria.
    """

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: CategoriaUnitOfWork, id: int) -> Categoria:
        categoria = uow.Categoria.get_by_id(id)
        if not categoria:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria con id={id} no encontrado",
            )
        return categoria

    def create(self, data: CategoriaCreate) -> CategoriaPublic:
        with CategoriaUnitOfWork(self._session) as uow:
            existente = uow.Categoria.get_by_nombre(data.nombre)
            if existente and existente.is_active:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe una categoria con el nombre '{data.nombre}'"
                )
            categoria = Categoria.model_validate(data)
            uow.Categoria.add(categoria)
            result = CategoriaPublic.model_validate(categoria)
        return result



    def get_all(self, offset: int = 0, limit: int = 20) -> CategoriaList:
        """
        Obtiene Categoria activas con paginación.
        """
        with CategoriaUnitOfWork(self._session) as uow:
            categorias = uow.Categoria.get_active(offset=offset, limit=limit)
            total = uow.Categoria.count()

            result = CategoriaList(
                data=[CategoriaPublic.model_validate(c) for c in categorias],
                total=total,
            )
        return result

    def get_by_id(self, id: int) -> CategoriaPublic:
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, id)
            result = CategoriaPublic.model_validate(categoria)
        return result
    

    def update(self, id: int, data: CategoriaUpdate) -> CategoriaPublic:
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, id)

            if data.nombre and data.nombre != categoria.nombre:
                existente = uow.Categoria.get_by_nombre(data.nombre)
                if existente and existente.is_active:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Ya existe otra categoria activa con el nombre '{data.nombre}'"
                    )


            patch = data.model_dump(exclude_unset=True)

            for field, value in patch.items():
                setattr(categoria, field, value)
            uow.Categoria.add(categoria)
            result = CategoriaPublic.model_validate(categoria)
        return result

    def soft_delete(self, id: int) -> None:
        with CategoriaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, id)
            categoria.is_active = False
            uow.Categoria.add(categoria)
