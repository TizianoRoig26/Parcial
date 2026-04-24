
from sqlmodel import Session, select, func

from app.core.repository import BaseRepository
from .models import Categoria



class CategoriaRepository(BaseRepository[Categoria]):

    def __init__(self, session: Session) -> None:
         
            super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
      
        return self.session.exec(
            select(Categoria).where(Categoria.nombre == nombre, Categoria.is_active == True)
        ).first()


    def get_active(self, offset: int = 0, limit: int = 20) -> list[Categoria]:
       
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.is_active == True)  # noqa: E712
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_categoria(self, categoria_id: int) -> list[Categoria]:
       
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.id == categoria_id)
            ).all()
        )

    def count(self) -> int:
        
        return self.session.exec(
            select(func.count(Categoria.id)).where(Categoria.is_active == True)
        ).one()

