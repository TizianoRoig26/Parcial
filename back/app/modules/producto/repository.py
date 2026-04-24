
from sqlmodel import Session, select, func
from app.core.repository import BaseRepository
from app.modules.producto.models import Producto
from app.modules.producto.links import ProductoCategoria



class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
            super().__init__(session, Producto)

    def get_by_nombre(self, nombre: str) -> Producto | None:
        return self.session.exec(
            select(Producto).where(Producto.nombre == nombre, Producto.is_active == True)
        ).first()


    def get_active(self, offset: int = 0, limit: int = 20) -> list[Producto]:
        return list(
            self.session.exec(
                select(Producto)
                .where(Producto.is_active == True)  # noqa: E712
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_categoria(self, categoria_id: int) -> list[Producto]:
        return list(
            self.session.exec(
                select(Producto)
                .join(ProductoCategoria, ProductoCategoria.producto_id == Producto.id)
                .where(ProductoCategoria.categoria_id == categoria_id)
            ).all()
        )

    def count(self) -> int:
        return self.session.exec(
            select(func.count(Producto.id)).where(Producto.is_active == True)
        ).one()

