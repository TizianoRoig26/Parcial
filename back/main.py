# back/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.database import create_db_and_tables
from app.modules.producto.router import router as producto_router
from app.modules.categoria.router import router as categoria_router
from app.modules.ingerediente.router import router as ingrediente_router

# Importar modelos para registro en SQLModel
from app.modules.categoria.models import Categoria
from app.modules.ingerediente.models import Ingrediente
from app.modules.producto.models import Producto

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación."""
    create_db_and_tables()
    yield


app = FastAPI(
    title="API de Gestión de Productos",
    description="Sistema CRUD de productos con arquitectura Service/UoW/Repository",
    version="1.0.0",
    lifespan=lifespan,
)

# Root endpoint para verificar que el server corre
@app.get("/", tags=["health"])
async def root():
    return {"mensaje": "API de Gestión de Productos operativa"}

# Registro de routers
app.include_router(producto_router, prefix="/productos", tags=["productos"])
app.include_router(categoria_router, prefix="/categorias", tags=["categorias"])
app.include_router(ingrediente_router, prefix="/ingredientes", tags=["ingredientes"])
