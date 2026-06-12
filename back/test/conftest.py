import pytest
import os
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool

from main import app 
from app.core.database import get_session 
from app.modules.usuario.model import Usuario
from app.modules.usuario.unit_of_work import UsuariosUnitOfWork
from app.modules.usuario.service import UsuarioService


@pytest.fixture(scope="session")
def engine():
    test_db_url = os.getenv("DATABASE_URL")
    
    assert "test" in test_db_url.lower(), "¡Peligro! No estás usando la BD de test."

    engine_test = create_engine(test_db_url)

    SQLModel.metadata.create_all(engine_test)
    
    yield engine_test
    SQLModel.metadata.drop_all(engine_test)

@pytest.fixture(scope="function")
def db_session(engine):
    with Session(engine) as session:
        yield session
        session.rollback()

@pytest.fixture(scope="function")
def client(db_session):
    def get_session_override():
        yield db_session

    app.dependency_overrides[get_session] = get_session_override
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()
def _crear_y_loguear(client, db_session, username, password, rol_codigo):
    response = client.post(
        "/api/v1/auth/token",
        data={"username": username, "password": password}
    )
    assert response.status_code == 200, "Falló el login en la fixture"
    return client

@pytest.fixture(scope="function")
def admin_client(client, db_session):
    return _crear_y_loguear(client, db_session, "admin_user", "Admin1234!", "ADMIN")

@pytest.fixture(scope="function")
def cliente_client(client, db_session):
    return _crear_y_loguear(client, db_session, "comprador", "Client1234!", "CLIENTE")

@pytest.fixture(scope="function")
def pedidos_client(client, db_session):
    return _crear_y_loguear(client, db_session, "cocina_user", "Pedido1234!", "PEDIDOS")


@pytest.fixture(scope="function")
def producto_factory(db_session):
    def _crear_producto(nombre="Producto Test", precio_base=1500):
        producto = Producto(
            nombre=nombre,
            descripcion="Descripción generada para tests",
            precio_base=precio_base,
            is_active=True
        )
        db_session.add(producto)
        db_session.commit()
        db_session.refresh(producto)
        return producto
        
    return _crear_producto

@pytest.fixture(scope="function")
def pedido_factory(db_session, producto_factory):
    def _crear_pedido(usuario_id: int, estado="PENDIENTE", pago="EFECTIVO"):
        # 1. Asegurarnos de que los catálogos existan en la BD de test
        if not db_session.get(EstadoPedido, estado):
            db_session.add(EstadoPedido(codigo=estado, descripcion=estado, orden=1, es_terminal=False))
        if not db_session.get(FormaPago, pago):
            db_session.add(FormaPago(codigo=pago, descripcion=pago, habilitado=True))
        db_session.commit()

        # 2. Crear un producto automático para engancharle al pedido
        producto = producto_factory()
        
        # 3. Crear la cabecera del Pedido
        costo_envio = Decimal("50.00")
        subtotal = Decimal(producto.precio_base)
        
        pedido = Pedido(
            usuario_id=usuario_id,
            estado_codigo=estado,
            forma_pago_codigo=pago,
            subtotal=subtotal,
            costo_envio=costo_envio,
            total=subtotal + costo_envio
        )
        db_session.add(pedido)
        db_session.commit()
        db_session.refresh(pedido)
        
        # 4. Crear el Detalle del Pedido
        detalle = DetallePedido(
            pedido_id=pedido.id,
            producto_id=producto.id,
            cantidad=1,
            nombre_snapshot=producto.nombre,
            precio_snapshot=Decimal(producto.precio_base),
            subtotal_snap=Decimal(producto.precio_base)
        )
        db_session.add(detalle)
        db_session.commit()
        
        return pedido
        
    return _crear_pedido