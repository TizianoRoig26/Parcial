from fastapi import Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.unit_of_work import UnitOfWork
from app.modules.usuario.rol_repository import RolRepository
from app.modules.usuario.repository import UsuarioRepository

class UsuariosUnitOfWork(UnitOfWork):

    def __init__(self, session: Session) -> None:

        super().__init__(session)
        self.usuarios = UsuarioRepository(session)
        self.roles = RolRepository(session)


def get_uow(session: Session = Depends(get_session)) -> UsuariosUnitOfWork:
    return UsuariosUnitOfWork(session)
