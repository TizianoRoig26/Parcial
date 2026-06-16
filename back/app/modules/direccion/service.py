from datetime import datetime, timezone

from sqlmodel import Session
from app.core.exceptions.custom_exceptions import ResourceNotFoundError

from app.modules.direccion.model import DireccionEntrega
from app.modules.direccion.schemas import (
    DireccionCreate,
    DireccionList,
    DireccionPublic,
    DireccionUpdate,
)
from app.modules.direccion.unit_of_work import DireccionUnitOfWork


class DireccionService:

    def __init__(self, session: Session) -> None:
        self._session = session


    def _get_or_404(
        self,
        uow: DireccionUnitOfWork,
        direccion_id: int,
        usuario_id: int,
    ) -> DireccionEntrega:
        direccion = uow.Direccion.get_by_id_and_usuario(direccion_id, usuario_id)
        if not direccion:
            raise ResourceNotFoundError(resource="direccion", identifier=direccion_id)
        return direccion

    def create(self, usuario_id: int, data: DireccionCreate) -> DireccionPublic:
        with DireccionUnitOfWork(self._session) as uow:

            direccion = DireccionEntrega(
                **data.model_dump(),
                usuario_id=usuario_id,
            )

            if data.es_principal:
                uow.Direccion.unset_principal_for_usuario(usuario_id)

            uow.Direccion.add(direccion)
            result = DireccionPublic.model_validate(direccion)

        return result

    def get_all(self, usuario_id: int, offset: int = 0, limit: int = 20) -> DireccionList:
        with DireccionUnitOfWork(self._session) as uow:
            direcciones = uow.Direccion.get_active_by_usuario(usuario_id, offset, limit)
            total = uow.Direccion.count_by_usuario(usuario_id)

            result = DireccionList(
                data=[DireccionPublic.model_validate(d) for d in direcciones],
                total=total,
            )

        return result

    def get_by_id(self, direccion_id: int, usuario_id: int) -> DireccionPublic:
        with DireccionUnitOfWork(self._session) as uow:
            direccion = self._get_or_404(uow, direccion_id, usuario_id)
            result = DireccionPublic.model_validate(direccion)

        return result

    def get_by_alias_and_usuario(self, alias: str, usuario_id: int) -> DireccionList:
        with DireccionUnitOfWork(self._session) as uow:
            direcciones = uow.Direccion.get_by_alias_and_usuario(alias, usuario_id)

            result = DireccionList(
                data=[DireccionPublic.model_validate(d) for d in direcciones],
                total=len(direcciones),
            )

        return result

    def update(self, direccion_id: int, usuario_id: int, data: DireccionUpdate) -> DireccionPublic:
        with DireccionUnitOfWork(self._session) as uow:
            direccion = self._get_or_404(uow, direccion_id, usuario_id)

            patch = data.model_dump(exclude_unset=True)


            if patch.get("es_principal") is True:
                uow.Direccion.unset_principal_for_usuario(usuario_id)

            for field, value in patch.items():
                setattr(direccion, field, value)

            uow.Direccion.add(direccion)
            result = DireccionPublic.model_validate(direccion)

        return result

    def soft_delete(self, direccion_id: int, usuario_id: int) -> None:
        with DireccionUnitOfWork(self._session) as uow:
            direccion = self._get_or_404(uow, direccion_id, usuario_id)
            direccion.deleted_at = datetime.now(timezone.utc)
            uow.Direccion.add(direccion)
