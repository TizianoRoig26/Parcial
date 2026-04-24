# app/modules/ingerediente/repository.py
from sqlmodel import Session, select, func
from app.core.repository import BaseRepository
from app.modules.ingerediente.models import Ingrediente
from app.modules.producto.links import ProductoIngrediente

class IngredienteRepository(BaseRepository[Ingrediente]):
    """
    Repositorio de Ingredientes.
    """
    def __init__(self, session: Session) -> None:
        super().__init__(session, Ingrediente)

    def get_by_nombre(self, nombre: str) -> Ingrediente | None:
        return self.session.exec(
            select(Ingrediente).where(Ingrediente.nombre == nombre, Ingrediente.is_active == True)
        ).first()


    def get_active(self, offset: int = 0, limit: int = 20) -> list[Ingrediente]:
        return list(
            self.session.exec(
                select(Ingrediente)
                .where(Ingrediente.is_active == True)
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_producto(self, producto_id: int) -> list[Ingrediente]:
        """Obtiene ingredientes de un producto via tabla N:N"""
        return list(
            self.session.exec(
                select(Ingrediente)
                .join(ProductoIngrediente)
                .where(ProductoIngrediente.producto_id == producto_id)
            ).all()
        )

    def count(self) -> int:
        return self.session.exec(
            select(func.count(Ingrediente.id)).where(Ingrediente.is_active == True)
        ).one()

