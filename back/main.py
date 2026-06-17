# back/main.py
from app.core.middleware.rate_limit.rate_limit_middleware import RateLimitMiddleware
from app.core.middleware.timing_middleware import TimingMiddleware
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.middleware.logging_middleware import LoggingMiddleware

from app.core.database import create_db_and_tables
from app.modules.producto.router import router as producto_router
from app.modules.categoria.router import router as categoria_router
from app.modules.ingerediente.router import router as ingrediente_router
from app.modules.direccion.router import router as direccion_router
from app.modules.pedido.router import router as pedido_router
from app.modules.usuario.router import router as usuarios_router
from app.modules.unidadMedida.router import router as unidad_medida_router
from app.modules.pago.router import router as pagos_router
from app.modules.imagen.router import router as imagen_router
from app.modules.estadisticas.router import router as estadisticas_router

# Importar modelos para registro en SQLModel
from app.modules.categoria.models import Categoria
from app.modules.ingerediente.models import Ingrediente
from app.modules.direccion.model import DireccionEntrega
from app.modules.producto.models import Producto
from app.modules.usuario.model import Usuario
from app.modules.usuario.rol import Rol
from app.modules.usuario.usuario_rol import UsuarioRol
from app.modules.pedido.models import DetallePedido, EstadoPedido, FormaPago, HistorialEstadoPedido, Pedido
from app.modules.imagen.models import Imagen
from app.db.seed import seed_pedido_catalogos, seed_roles, seed_pedidos



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestión del ciclo de vida de la aplicación."""
    create_db_and_tables()
    seed_roles()
    seed_pedido_catalogos()
    seed_pedidos()
    yield


from fastapi.middleware.cors import CORSMiddleware
from app.core.exceptions.exceptions_handlers import register_exception_handlers

app = FastAPI(
    title="API de Gestión de Productos",
    description="Sistema CRUD de productos con arquitectura Service/UoW/Repository",
    version="1.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.add_middleware(RateLimitMiddleware) 
app.add_middleware(LoggingMiddleware)
app.add_middleware(TimingMiddleware)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174"],  # En producción, usa una lista de dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# Root endpoint para verificar que el server corre
@app.get("/", tags=["health"])
async def root():
    return {"mensaje": "API de Gestión de Productos operativa"}

# Registro de routers
app.include_router(usuarios_router, tags=["auth"])
app.include_router(producto_router, prefix="/api/v1/productos", tags=["productos"])
app.include_router(categoria_router, prefix="/api/v1/categorias", tags=["categorias"])
app.include_router(ingrediente_router, prefix="/api/v1/ingredientes", tags=["ingredientes"])
app.include_router(direccion_router, prefix="/api/v1/direcciones", tags=["direcciones"])
app.include_router(pedido_router, prefix="/api/v1/pedidos", tags=["pedidos"])
app.include_router(unidad_medida_router, prefix="/api/v1/unidades-medida", tags=["unidades-medida"])
app.include_router(pagos_router, prefix="/api/v1/pagos", tags=["pagos"])

app.include_router(imagen_router, prefix="/api/v1/imagenes", tags=["imagenes"])
app.include_router(estadisticas_router, prefix="/api/v1/estadisticas", tags=["estadisticas"])
