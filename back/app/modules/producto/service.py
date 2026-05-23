
from fastapi import HTTPException, status
from sqlmodel import Session

from app.modules.producto.unit_of_work import ProductoUnitOfWork
from app.modules.producto.models import Producto
from app.modules.producto.links import ProductoCategoria, ProductoIngrediente
from app.modules.producto.schemas import ProductoCreate, ProductoPublic, ProductoUpdate, ProductoList, IngredientePublic

from app.modules.categoria.repository import CategoriaRepository

class ProductoService:

    def __init__(self, session: Session) -> None:
        self._session = session

    def _get_or_404(self, uow: ProductoUnitOfWork, id: int) -> Producto:
        producto = uow.Producto.get_by_id(id)
        if not producto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id={id} no encontrado",
            )
        return producto

    def create(self, data: ProductoCreate) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            # Check duplicado
            if uow.Producto.get_by_nombre(data.nombre):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Ya existe un producto con el nombre '{data.nombre}'"
                )
            producto = Producto.model_validate(data)
            uow.Producto.add(producto)
            result = ProductoPublic.model_validate(producto)
        return result


    def get_all(self, offset: int = 0, limit: int = 20) -> ProductoList:
        """
        Obtiene todos los productos con paginación.
        """
        with ProductoUnitOfWork(self._session) as uow:
            all_productos = uow.Producto.get_all()
            total = len(all_productos)
            productos = all_productos[offset : offset + limit]

            result = ProductoList(
                data=[ProductoPublic.model_validate(p) for p in productos],
                total=total,
            )
        return result

    def get_by_id(self, id: int) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, id)
            result = ProductoPublic.model_validate(producto)
        return result

    def update(self, id: int, data: ProductoUpdate) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, id)
            
            # Check duplicado si cambia nombre
            if data.nombre and data.nombre != producto.nombre:
                if uow.Producto.get_by_nombre(data.nombre):
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail=f"Ya existe otro producto con el nombre '{data.nombre}'"
                    )

            patch = data.model_dump(exclude_unset=True)
            for field, value in patch.items():
                setattr(producto, field, value)
            uow.Producto.add(producto)
            result = ProductoPublic.model_validate(producto)
        return result

    def change_state(self, id: int) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, id)
            producto.is_active = not producto.is_active
            uow.Producto.add(producto)
            result = ProductoPublic.model_validate(producto)
        return result


    def soft_delete(self, id: int) -> None:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, id)
            producto.is_active = False
            uow.Producto.add(producto)


    def assign_category(self, producto_id: int, categoria_ids: list[int]) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:

            producto = self._get_or_404(uow, producto_id)
            
            existentes = {c.id for c in producto.categorias}
            nuevas_categorias = []
            for cid in set(categoria_ids):
                if cid in existentes:
                    continue
                cat = uow.Categoria.get_by_id(cid)
                if cat:
                    nuevas_categorias.append(cat)
            
            producto.categorias = nuevas_categorias
            uow.Producto.add(producto)
            self._session.commit()
            self._session.refresh(producto)
            return ProductoPublic.model_validate(producto)

    def get_ingredientes(self, id: int) -> list[IngredientePublic]:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, id)
            return [IngredientePublic.model_validate(i) for i in producto.ingredientes]

    def assign_ingrediente(self, producto_id: int, ingrediente_ids: list[int]) -> ProductoPublic:
        with ProductoUnitOfWork(self._session) as uow:
            producto = self._get_or_404(uow, producto_id)
            
            nuevos_ingredientes = []
            for iid in set(ingrediente_ids):
                ing = uow.Ingrediente.get_by_id(iid)
                if ing:
                    nuevos_ingredientes.append(ing)
            
            producto.ingredientes = nuevos_ingredientes
            uow.Producto.add(producto)
            self._session.commit()
            self._session.refresh(producto)
            return ProductoPublic.model_validate(producto)
    
    def search_by_nombre(self, alias: str) -> list[ProductoPublic]:
        with ProductoUnitOfWork(self._session) as uow:
            productos = uow.Producto.search_by_nombre(alias)
            return [ProductoPublic.model_validate(p) for p in productos]
        