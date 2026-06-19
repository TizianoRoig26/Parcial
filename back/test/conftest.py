import pytest
import os
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy import event

from sqlmodel import select
from app.core.security import hash_password
from app.modules.usuario.usuario_rol import UsuarioRol

from main import app
from app.core.database import get_session
from app.modules.usuario.model import Usuario
from app.modules.usuario.rol import Rol
from app.modules.usuario.unit_of_work import UsuariosUnitOfWork
from app.modules.usuario.service import UsuarioService
from app.modules.producto.models import Producto
from app.modules.pedido.models import Pedido, DetallePedido, EstadoPedido, FormaPago

@pytest.fixture(scope="function", autouse=True)
def reset_login_limits():
    from app.core.middleware.rate_limit.rate_limit_middleware import RateLimitMiddleware
    RateLimitMiddleware.reset_all_limiters()

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
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()
    
@pytest.fixture(scope="function", autouse=True)
def seed_roles_test(db_session):

    if not db_session.get(Rol, "CLIENT"):
        db_session.add(Rol(codigo="CLIENT", nombre="Cliente"))
    if not db_session.get(Rol, "ADMIN"):
        db_session.add(Rol(codigo="ADMIN", nombre="Administrador"))
    if not db_session.get(Rol, "PEDIDOS"):
        db_session.add(Rol(codigo="PEDIDOS", nombre="Encargado de Pedidos"))
    
    db_session.commit()    

@pytest.fixture(scope="function")
def client(db_session):
    from app.core.middleware.rate_limit.rate_limit_middleware import RateLimitMiddleware
    RateLimitMiddleware.reset_all_limiters()

    def get_session_override():
        yield db_session

    app.dependency_overrides[get_session] = get_session_override
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()

def _crear_y_loguear(client, db_session, username, password, rol_codigo):
    usuario = db_session.exec(select(Usuario).where(Usuario.username == username)).first()
    
    if not usuario:
        usuario = Usuario(
            username=username,
            full_name=f"Usuario {username}",
            email=f"{username}@foodstore.com",
            hashed_password=hash_password(password)
        )
        db_session.add(usuario)
        db_session.commit()
        db_session.refresh(usuario)
        
        db_session.add(UsuarioRol(usuario_id=usuario.id, rol_codigo=rol_codigo))
        db_session.commit()

    response = client.post(
        "/api/v1/auth/token",
        data={"username": username, "password": password}
    )
    assert response.status_code == 200, f"Falló el login: {response.json()}"
    return client

@pytest.fixture(scope="function")
def admin_client(client, db_session):
    return _crear_y_loguear(client, db_session, "admin_user", "Admin1234!", "ADMIN")

@pytest.fixture(scope="function")
def cliente_client(client, db_session):
    return _crear_y_loguear(client, db_session, "comprador", "Client1234!", "CLIENT")

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
        if not db_session.get(EstadoPedido, estado):
            db_session.add(EstadoPedido(codigo=estado, descripcion=estado, orden=1, es_terminal=False))
        if not db_session.get(FormaPago, pago):
            db_session.add(FormaPago(codigo=pago, descripcion=pago, habilitado=True))
        db_session.commit()

        producto = producto_factory()
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

@pytest.fixture(scope="function", autouse=True)
def seed_catalogos_pedidos(db_session):
    if not db_session.get(FormaPago, "EFECTIVO"):
        db_session.add(FormaPago(codigo="EFECTIVO", descripcion="EFECTIVO", habilitado=True))
    if not db_session.get(FormaPago, "MERCADOPAGO"):
        db_session.add(FormaPago(codigo="MERCADOPAGO", descripcion="MERCADOPAGO", habilitado=True))
    if not db_session.get(FormaPago, "TRANSFERENCIA"):
        db_session.add(FormaPago(codigo="TRANSFERENCIA", descripcion="TRANSFERENCIA", habilitado=True))

    estados = [
        ("PENDIENTE", False),
        ("CONFIRMADO", False),
        ("EN_PREP", False),
        ("ENTREGADO", True),
        ("CANCELADO", True)
    ]
    for cod, terminal in estados:
        if not db_session.get(EstadoPedido, cod):
            db_session.add(EstadoPedido(codigo=cod, descripcion=cod, orden=1, es_terminal=terminal))

    db_session.commit()