# app/modules/producto/repository.py
from sqlmodel import Session, select, func
from app.core.repository import BaseRepository
from app.modules.producto.models import Producto
from app.modules.producto.links import ProductoCategoria



class ProductoRepository(BaseRepository[Producto]):
    """
    Repositorio de Productos.
    Agrega queries específicas del dominio sobre el CRUD base.
    Solo habla con la DB — nunca levanta HTTPException.
    """
    def __init__(self, session: Session) -> None:
            """
            Inicializa el repositorio de Producto.

            Args:
                session (Session): Sesión activa de base de datos.
            """
            super().__init__(session, Producto)

    def get_by_nombre(self, nombre: str) -> Producto | None:
        """
        Obtiene un Producto activo por su nombre.
        """
        return self.session.exec(
            select(Producto).where(Producto.nombre == nombre, Producto.is_active == True)
        ).first()


    def get_active(self, offset: int = 0, limit: int = 20) -> list[Producto]:
        """
        Obtiene productos activos con paginación.

        Args:
            offset (int): Cantidad de registros a omitir.
            limit (int): Máximo de registros a devolver.

        Returns:
            list[Producto]: Lista de productos activos.
        """
        return list(
            self.session.exec(
                select(Producto)
                .where(Producto.is_active == True)  # noqa: E712
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_categoria(self, categoria_id: int) -> list[Producto]:
        """
        Obtiene todos los productos asociados a una categoria.

        Args:
            categoria_id (int): ID de la categoria.

        Returns:
            list[Producto]: Lista de productos pertenecientes a la categoria.
        """
        return list(
            self.session.exec(
                select(Producto)
                .join(ProductoCategoria, ProductoCategoria.producto_id == Producto.id)
                .where(ProductoCategoria.categoria_id == categoria_id)
            ).all()
        )

    def count(self) -> int:
        """Cuenta solo productos activos."""
        return self.session.exec(
            select(func.count(Producto.id)).where(Producto.is_active == True)
        ).one()

