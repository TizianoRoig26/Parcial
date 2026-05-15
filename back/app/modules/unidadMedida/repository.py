
from sqlmodel import Session, select, func

from app.core.repository import BaseRepository
from .models import UnidadMedida



class UnidadMedidaRepository(BaseRepository[UnidadMedida]):

    def __init__(self, session: Session) -> None:
         
            super().__init__(session, UnidadMedida)

    def get_by_nombre(self, nombre: str) -> UnidadMedida | None:
      
        return self.session.exec(
            select(UnidadMedida).where(UnidadMedida.nombre == nombre, UnidadMedida.is_active)
        ).first()


    def get_active(self, offset: int = 0, limit: int = 20) -> list[UnidadMedida]:
       
        return list(
            self.session.exec(
                select(UnidadMedida)
                .where(UnidadMedida.is_active) 
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def count(self) -> int:
        
        return self.session.exec(
            select(func.count(UnidadMedida.id)).where(UnidadMedida.is_active == True)
        ).one()

