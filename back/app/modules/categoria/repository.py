# app/modules/categoria/repository.py
from sqlmodel import Session, select, func

from app.core.repository import BaseRepository
from .models import Categoria



class CategoriaRepository(BaseRepository[Categoria]):
    """
    Repositorio de Categoria.
    Agrega queries específicas del dominio sobre el CRUD base.
    Solo habla con la DB — nunca levanta HTTPException.
    """
    def __init__(self, session: Session) -> None:
            """
            Inicializa el repositorio de Categoria.

            Args:
                session (Session): Sesión activa de base de datos.
            """
            super().__init__(session, Categoria)

    def get_by_nombre(self, nombre: str) -> Categoria | None:
        """
        Obtiene una Categoria activa por su nombre.
        """
        return self.session.exec(
            select(Categoria).where(Categoria.nombre == nombre, Categoria.is_active == True)
        ).first()


    def get_active(self, offset: int = 0, limit: int = 20) -> list[Categoria]:
        """
        Obtiene categorias activas con paginación.

        Args:
            offset (int): Cantidad de registros a omitir.
            limit (int): Máximo de registros a devolver.

        Returns:
            list[Categoria]: Lista de categorias activas.
        """
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.is_active == True)  # noqa: E712
                .offset(offset)
                .limit(limit)
            ).all()
        )

    def get_by_categoria(self, categoria_id: int) -> list[Categoria]:
        """
        Obtiene todas las categorias asociadas a una categoria.

        Args:
            categoria_id (int): ID de la categoria.

        Returns:
            list[Categoria]: Lista de las Categorias pertenecientes a la categoria.
        """
        return list(
            self.session.exec(
                select(Categoria)
                .where(Categoria.id == categoria_id)
            ).all()
        )

    def count(self) -> int:
        """Cuenta solo categorias activas."""
        return self.session.exec(
            select(func.count(Categoria.id)).where(Categoria.is_active == True)
        ).one()

