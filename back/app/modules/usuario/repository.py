"""
Repositorio de Usuario.

Acceso a BD: queries sin lógica de negocio.
Hereda de BaseRepository[Usuario] y agrega queries específicas.

Capa: Repository
Conoce a: Model (Usuario), Session
NO conoce a: Service, Router
"""

from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.core.repository import BaseRepository
from app.modules.usuario.model import Usuario


class UsuarioRepository(BaseRepository[Usuario]):

    def __init__(self, session: Session):
        super().__init__(session, Usuario)

    def get_by_username(self, username: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario)
            .where(Usuario.username == username)
            .options(selectinload(Usuario.roles))
        ).first()

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(
            select(Usuario)
            .where(Usuario.email == email)
            .options(selectinload(Usuario.roles))
        ).first()

    def get_by_id(self, entity_id: int) -> Usuario | None:
        return self.session.exec(
            select(Usuario)
            .where(Usuario.id == entity_id)
            .options(selectinload(Usuario.roles))
        ).first()

    def get_by_id_name(self, entity_id: int) -> Usuario | None:
        return self.session.exec(
            select(Usuario.full_name)
            .where(Usuario.id == entity_id)
        ).first()

    def get_all(self) -> list[Usuario]:
        return list(
            self.session.exec(
                select(Usuario).options(selectinload(Usuario.roles))
            ).all()
        )
