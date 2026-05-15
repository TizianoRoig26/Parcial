from sqlmodel import Session, select

from app.core.repository import BaseRepository
from app.modules.usuario.rol import Rol


class RolRepository(BaseRepository[Rol]):
    def __init__(self, session: Session):
        super().__init__(session, Rol)

    def get_by_codigo(self, codigo: str) -> Rol | None:
        return self.session.exec(
            select(Rol).where(Rol.codigo == codigo)
        ).first()
