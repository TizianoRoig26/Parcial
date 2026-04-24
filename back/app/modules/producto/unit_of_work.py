from sqlmodel import Session
from app.core.unit_of_work import UnitOfWork
from app.core.repository import BaseRepository
from app.modules.producto.repository import ProductoRepository
from app.modules.categoria.repository import CategoriaRepository
from app.modules.ingerediente.repository import IngredienteRepository
from app.modules.producto.links import ProductoCategoria, ProductoIngrediente

class ProductoUnitOfWork(UnitOfWork):

    def __init__(self, session: Session) -> None:

        super().__init__(session)
        self.Producto = ProductoRepository(session)
        self.Categoria = CategoriaRepository(session)
        self.Ingrediente = IngredienteRepository(session)
        self.ProductoCategoria = BaseRepository(session, ProductoCategoria)
        self.ProductoIngrediente = BaseRepository(session, ProductoIngrediente)


