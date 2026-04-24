
from fastapi import HTTPException, status
from sqlmodel import Session

from app.modules.ingerediente.unit_of_work import IngredienteUnitOfWork
from app.modules.ingerediente.models import Ingrediente
from app.modules.ingerediente.schemas import IngredienteCreate, IngredientePublic, IngredienteUpdate, IngredienteList

class IngredienteService:

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: IngredienteUnitOfWork, id: int) -> Ingrediente:
        ingrediente = uow.Ingrediente.get_by_id(id)
        if not ingrediente:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ingrediente con id={id} no encontrado",
            )
        return ingrediente

    def create(self, data: IngredienteCreate) -> IngredientePublic:
        with IngredienteUnitOfWork(self._session) as uow:
            if uow.Ingrediente.get_by_nombre(data.nombre):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un ingrediente con el nombre '{data.nombre}'"
                )
            ingrediente = Ingrediente.model_validate(data)
            uow.Ingrediente.add(ingrediente)
            result = IngredientePublic.model_validate(ingrediente)
        return result


    def get_all(self, offset: int = 0, limit: int = 20) -> IngredienteList:
        with IngredienteUnitOfWork(self._session) as uow:
            ingredientes = uow.Ingrediente.get_active(offset=offset, limit=limit)
            total = uow.Ingrediente.count()
            result = IngredienteList(
                data=[IngredientePublic.model_validate(i) for i in ingredientes],
                total=total,
            )
        return result

    def get_by_id(self, id: int) -> IngredientePublic:
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, id)
            result = IngredientePublic.model_validate(ingrediente)
        return result

    def update(self, id: int, data: IngredienteUpdate) -> IngredientePublic:
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, id)

            if data.nombre and data.nombre != ingrediente.nombre:
                if uow.Ingrediente.get_by_nombre(data.nombre):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Ya existe otro ingrediente con el nombre '{data.nombre}'"
                    )

            patch = data.model_dump(exclude_unset=True)

            for field, value in patch.items():
                setattr(ingrediente, field, value)
            uow.Ingrediente.add(ingrediente)
            result = IngredientePublic.model_validate(ingrediente)
        return result

    def soft_delete(self, id: int) -> None:
        with IngredienteUnitOfWork(self._session) as uow:
            ingrediente = self._get_or_404(uow, id)
            ingrediente.is_active = False
            uow.Ingrediente.add(ingrediente)