from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.modules.categoria.repository import CategoriaRepository

class CategoriaUnitOfWork(UnitOfWork):
    """
    UoW específico del módulo Categoria.
    Expone los repositorios que el servicio necesita coordinar.
    """

    def __init__(self, session: Session) -> None:
        """
        UnitOfWork específico del dominio Categoria.
        """
        super().__init__(session)
        self.Categoria = CategoriaRepository(session)

