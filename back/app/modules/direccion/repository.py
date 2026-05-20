from sqlmodel import Session, select, func

from app.core.repository import BaseRepository
from app.modules.direccion.model import DireccionEntrega


class DireccionRepository(BaseRepository[DireccionEntrega]):

    def __init__(self, session: Session) -> None:
        super().__init__(session, DireccionEntrega)

    def get_active_by_usuario(
        self,
        usuario_id: int,
        offset: int = 0,
        limit: int = 20,
    ) -> list[DireccionEntrega]:
        return list(
            self.session.exec(
                select(DireccionEntrega)
                .where(
                    DireccionEntrega.usuario_id == usuario_id,
                    DireccionEntrega.deleted_at.is_(None),
                )
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_alias_and_usuario(
        self,
        alias: str,
        usuario_id: int,
    ) -> list[DireccionEntrega]:
        return self.session.exec(
            select(DireccionEntrega).where(
                DireccionEntrega.alias.ilike(f"%{alias}%"),
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
        ).all()

    def get_by_id_and_usuario(self, direccion_id: int, usuario_id: int) -> DireccionEntrega | None:
        return self.session.exec(
            select(DireccionEntrega).where(
                DireccionEntrega.id == direccion_id,
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
        ).first()

    def count_by_usuario(self, usuario_id: int) -> int:
        return self.session.exec(
            select(func.count(DireccionEntrega.id)).where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.deleted_at.is_(None),
            )
        ).one()

    def unset_principal_for_usuario(self, usuario_id: int) -> None:
        direcciones = self.session.exec(
            select(DireccionEntrega).where(
                DireccionEntrega.usuario_id == usuario_id,
                DireccionEntrega.es_principal == True,  # noqa: E712
                DireccionEntrega.deleted_at.is_(None),
            )
        ).all()

        for direccion in direcciones:
            direccion.es_principal = False
            self.session.add(direccion)

        self.session.flush()
