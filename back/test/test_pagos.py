import pytest
from sqlmodel import select
from app.modules.pedido.models import Pedido
from app.modules.usuario.model import Usuario
from app.core.config import settings

@pytest.fixture(scope="function", autouse=True)
def set_frontend_url_settings(monkeypatch):
    # Aseguramos que la URL del frontend de cliente en settings esté configurada para el test
    monkeypatch.setattr(settings, "FRONTEND_CLIENTE_URL", "http://localhost:5174")

def test_redirect_success_marca_pedido_como_pagado(cliente_client, db_session, pedido_factory):
    # Obtener el ID del usuario comprador creado por cliente_client
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    assert usuario is not None

    # 1. Crear un pedido de prueba
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    assert pedido.pagado is False

    # 2. Realizar la petición GET de redirección con success
    response = cliente_client.get(f"/pagos/redirect/{pedido.id}/success", follow_redirects=False)

    # 3. Verificar redirección
    assert response.status_code in (302, 307)
    assert response.headers["location"].startswith("http://localhost:5174/catalogo")

    # 4. Verificar que el pedido se marcó como pagado en la base de datos
    db_session.expire_all()
    pedido_db = db_session.exec(select(Pedido).where(Pedido.id == pedido.id)).first()
    assert pedido_db.pagado is True

def test_redirect_failure_no_marca_pedido_como_pagado(cliente_client, db_session, pedido_factory):
    # Obtener el ID del usuario comprador creado por cliente_client
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    assert usuario is not None

    # 1. Crear un pedido de prueba
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    assert pedido.pagado is False

    # 2. Realizar la petición GET de redirección con failure
    response = cliente_client.get(f"/pagos/redirect/{pedido.id}/failure", follow_redirects=False)

    # 3. Verificar redirección
    assert response.status_code in (302, 307)
    assert response.headers["location"].startswith("http://localhost:5174/catalogo")

    # 4. Verificar que el pedido NO se marcó como pagado
    db_session.expire_all()
    pedido_db = db_session.exec(select(Pedido).where(Pedido.id == pedido.id)).first()
    assert pedido_db.pagado is False

def test_redirect_compatibilidad_ruta_vieja(cliente_client, db_session, pedido_factory):
    # Obtener el ID del usuario comprador creado por cliente_client
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    assert usuario is not None

    # 1. Crear un pedido de prueba
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    assert pedido.pagado is False

    # 2. Realizar la petición GET de redirección con el prefijo /api/v1
    response = cliente_client.get(f"/api/v1/pagos/redirect/{pedido.id}/success", follow_redirects=False)

    # 3. Verificar redirección
    assert response.status_code in (302, 307)
    assert response.headers["location"].startswith("http://localhost:5174/catalogo")

    # 4. Verificar que el pedido se marcó como pagado en la base de datos
    db_session.expire_all()
    pedido_db = db_session.exec(select(Pedido).where(Pedido.id == pedido.id)).first()
    assert pedido_db.pagado is True

