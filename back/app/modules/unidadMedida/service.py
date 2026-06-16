
from sqlmodel import Session
from app.core.exceptions.custom_exceptions import ResourceNotFoundError

from app.modules.unidadMedida.unit_of_work import UnidadMedidaUnitOfWork
from app.modules.unidadMedida.models import UnidadMedida
from app.modules.unidadMedida.schemas import UnidadMedidaPublic, UnidadMedidaList

class UnidadMedidaService:

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: UnidadMedidaUnitOfWork, id: int) -> UnidadMedida:
        unidadMedida = uow.unidadMedida.get_by_id(id)
        if not unidadMedida:
            raise ResourceNotFoundError(resource="unidad de medida", identifier=id)
        return unidadMedida

    def get_all(self, offset: int = 0, limit: int = 20) -> UnidadMedidaList:

        with UnidadMedidaUnitOfWork(self._session) as uow:
            unidadMedidas = uow.unidadMedida.get_active(offset=offset, limit=limit)
            total = uow.unidadMedida.count()

            result = UnidadMedidaList(
                data=[UnidadMedidaPublic.model_validate(c) for c in unidadMedidas],
                total=total,
            )
        return result

    def get_by_id(self, id: int) -> UnidadMedidaPublic:
        with UnidadMedidaUnitOfWork(self._session) as uow:
            categoria = self._get_or_404(uow, id)
            result = UnidadMedidaPublic.model_validate(categoria)
        return result
    