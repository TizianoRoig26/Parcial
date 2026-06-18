import pytest
from unittest.mock import patch, MagicMock
from sqlmodel import select
from decimal import Decimal
from app.modules.pedido.models import Pedido
from app.modules.pago.models import Pago
from app.modules.usuario.model import Usuario
from app.core.config import settings

@pytest.fixture(scope="function", autouse=True)
def set_frontend_url_settings(monkeypatch):
    # Aseguramos que la URL del frontend de cliente en settings esté configurada para el test
    monkeypatch.setattr(settings, "FRONTEND_CLIENTE_URL", "http://localhost:5174")
    # Asegurar token configurado
    monkeypatch.setattr(settings, "MP_ACCESS_TOKEN", "TEST_ACCESS_TOKEN")

@pytest.fixture
def mock_mercadopago():
    with patch("mercadopago.SDK") as mock_sdk_class:
        mock_sdk = MagicMock()
        mock_sdk_class.return_value = mock_sdk
        
        # Mock preference create
        mock_preference = MagicMock()
        mock_preference.create.return_value = {
            "status": 201,
            "response": {
                "id": "pref_mp_123456",
                "init_point": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_mp_123456"
            }
        }
        mock_sdk.preference.return_value = mock_preference
        
        # Mock payment get
        mock_payment = MagicMock()
        mock_payment.get.return_value = {
            "status": 200,
            "response": {
                "id": 999888777,
                "status": "approved",
                "status_detail": "accredited",
                "merchant_order_id": 111222333,
                "transaction_amount": 1550.00,
                "payment_method_id": "visa",
                "external_reference": "1" # se pisa dinámicamente en los tests si se requiere
            }
        }
        mock_sdk.payment.return_value = mock_payment
        
        yield mock_sdk_class, mock_preference, mock_payment

def test_redirect_success_marca_pedido_como_pagado(cliente_client, db_session, pedido_factory):
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    assert usuario is not None

    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    assert pedido.pagado is False

    response = cliente_client.get(f"/api/v1/pagos/redirect/{pedido.id}/success", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"].startswith("http://localhost:5174/catalogo")

    db_session.expire_all()
    pedido_db = db_session.exec(select(Pedido).where(Pedido.id == pedido.id)).first()
    assert pedido_db.pagado is True
    # La redirección también debería haberlo avanzado a CONFIRMADO
    assert pedido_db.estado_codigo == "CONFIRMADO"

def test_redirect_failure_no_marca_pedido_como_pagado(cliente_client, db_session, pedido_factory):
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    assert usuario is not None

    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    assert pedido.pagado is False

    response = cliente_client.get(f"/api/v1/pagos/redirect/{pedido.id}/failure", follow_redirects=False)

    assert response.status_code in (302, 307)
    assert response.headers["location"].startswith("http://localhost:5174/catalogo")

    db_session.expire_all()
    pedido_db = db_session.exec(select(Pedido).where(Pedido.id == pedido.id)).first()
    assert pedido_db.pagado is False
    assert pedido_db.estado_codigo == "PENDIENTE"

def test_create_preference_ok(cliente_client, db_session, pedido_factory, mock_mercadopago):
    mock_sdk_class, mock_preference, _ = mock_mercadopago
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")

    payload = {"pedido_id": pedido.id}
    response = cliente_client.post("/api/v1/pagos/create-preference", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["preference_id"] == "pref_mp_123456"
    assert data["init_point"].startswith("https://www.mercadopago")

    # Verificar que el pago se registró localmente como pendiente
    db_session.expire_all()
    pago_db = db_session.exec(select(Pago).where(Pago.pedido_id == pedido.id)).first()
    assert pago_db is not None
    assert pago_db.estado == "pendiente"
    assert pago_db.mp_preference_id == "pref_mp_123456"

def test_webhook_approved_payment(cliente_client, db_session, pedido_factory, mock_mercadopago):
    _, _, mock_payment = mock_mercadopago
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")

    # 1. Crear un pago local "pendiente"
    pago = Pago(
        pedido_id=pedido.id,
        monto=float(pedido.total),
        transaction_amount=pedido.total,
        estado="pendiente",
        mp_preference_id="pref_mp_123456",
        idempotency_key="unique_key_123",
        mp_payment_id=999888777
    )
    db_session.add(pago)
    db_session.commit()

    # 2. Configurar mock del get_payment para que devuelva los datos correctos
    mock_payment.return_value = {
        "status": 200,
        "response": {
            "id": 999888777,
            "status": "approved",
            "status_detail": "accredited",
            "merchant_order_id": 111222333,
            "transaction_amount": float(pedido.total),
            "payment_method_id": "visa",
            "external_reference": str(pedido.id)
        }
    }

    # 3. Invocar endpoint del webhook
    payload = {
        "type": "payment",
        "data": {"id": "999888777"}
    }
    response = cliente_client.post("/api/v1/pagos/webhook", json=payload)

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "processed"
    assert res_data["estado"] == "aprobado"

    # 4. Verificar que se actualizó el pago local, el pedido se marcó como pagado y su estado avanzó a CONFIRMADO
    db_session.expire_all()
    pago_db = db_session.exec(select(Pago).where(Pago.id == pago.id)).first()
    assert pago_db.estado == "aprobado"
    assert pago_db.mp_status == "approved"
    assert pago_db.mp_status_detail == "accredited"

    pedido_db = db_session.exec(select(Pedido).where(Pedido.id == pedido.id)).first()
    assert pedido_db.pagado is True
    assert pedido_db.estado_codigo == "CONFIRMADO"

def test_webhook_idempotency(cliente_client, db_session, pedido_factory, mock_mercadopago):
    _, _, mock_payment = mock_mercadopago
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")

    # 1. Crear pago local ya aprobado
    pago = Pago(
        pedido_id=pedido.id,
        monto=float(pedido.total),
        transaction_amount=pedido.total,
        estado="aprobado",  # ya procesado
        mp_preference_id="pref_mp_123456",
        idempotency_key="unique_key_123",
        mp_payment_id=999888777
    )
    db_session.add(pago)
    db_session.commit()

    # 2. Configurar mock
    mock_payment.return_value = {
        "status": 200,
        "response": {
            "id": 999888777,
            "status": "approved",
            "status_detail": "accredited",
            "merchant_order_id": 111222333,
            "transaction_amount": float(pedido.total),
            "payment_method_id": "visa",
            "external_reference": str(pedido.id)
        }
    }

    # 3. Invocar webhook de nuevo
    payload = {
        "type": "payment",
        "data": {"id": "999888777"}
    }
    response = cliente_client.post("/api/v1/pagos/webhook", json=payload)

    # Debería retornar "already_processed" y no realizar acciones repetidas
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "already_processed"
    assert res_data["estado"] == "aprobado"
