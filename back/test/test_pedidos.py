import pytest
from sqlmodel import select

from app.modules.pedido.models import HistorialEstadoPedido, FormaPago, EstadoPedido
from app.modules.usuario.model import Usuario
from app.modules.ingerediente.models import Ingrediente
from app.modules.producto.models import ProductoIngrediente 

@pytest.fixture(scope="function", autouse=True)
def seed_catalogos_pedidos(db_session):
    if not db_session.get(FormaPago, "EFECTIVO"):
        db_session.add(FormaPago(codigo="EFECTIVO", descripcion="Efectivo", habilitado=True))
        
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

def test_crear_pedido_ok(cliente_client, db_session, producto_factory):
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    producto = producto_factory()
    
    payload = {
        "forma_pago_codigo": "EFECTIVO",
        "items": [
            {
                "producto_id": producto.id,
                "cantidad": 1
            }
        ]
    }
    
    response = cliente_client.post("/api/v1/pedidos", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["usuario_id"] == usuario.id
    assert data["estado_codigo"] == "PENDIENTE"
    assert float(data["total"]) > 0


def test_stock_insuficiente(cliente_client, db_session, producto_factory):
    producto = producto_factory()
    
    ingrediente = Ingrediente(
        nombre="Ingrediente Sin Stock", 
        descripcion="Ingrediente de prueba", 
        stock_cantidad=0
    )
    db_session.add(ingrediente)
    db_session.commit()
    
    relacion = ProductoIngrediente(
        producto_id=producto.id, 
        ingrediente_id=ingrediente.id, 
        cantidad_requerida=1,
        es_removible=False
    )
    db_session.add(relacion)
    db_session.commit()

    payload = {
        "forma_pago_codigo": "EFECTIVO",
        "items": [
            {
                "producto_id": producto.id,
                "cantidad": 1
            }
        ]
    }
    
    response = cliente_client.post("/api/v1/pedidos", json=payload)
    
    assert response.status_code == 400
    assert "stock insuficiente" in response.json()["detail"].lower()


def test_avanzar_estado_valido_fsm(pedidos_client, db_session, pedido_factory):
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "cocina_user")).first()
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    
    payload = {
        "estado_hacia": "CONFIRMADO",
        "motivo": "Confirmación de prueba"
    }
    
    response = pedidos_client.patch(f"/api/v1/pedidos/{pedido.id}/estado", json=payload)
    
    assert response.status_code == 200
    assert response.json()["estado_codigo"] == "CONFIRMADO"
    
    historial = db_session.exec(
        select(HistorialEstadoPedido).where(HistorialEstadoPedido.pedido_id == pedido.id)
    ).all()

    assert len(historial) == 1 
    assert historial[-1].estado_hacia == "CONFIRMADO"


def test_avanzar_estado_invalido_fsm(pedidos_client, db_session, pedido_factory):
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "cocina_user")).first()
    pedido = pedido_factory(usuario_id=usuario.id, estado="ENTREGADO")
    
    payload = {
        "estado_hacia": "EN_PREP"
    }
    
    response = pedidos_client.patch(f"/api/v1/pedidos/{pedido.id}/estado", json=payload)
    
    assert response.status_code == 400 
    assert "transición no permitida" in response.json()["detail"].lower()


def test_cancelar_propio(cliente_client, db_session, pedido_factory):
    usuario = db_session.exec(select(Usuario).where(Usuario.username == "comprador")).first()
    pedido = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    
    payload = {
        "estado_hacia": "CANCELADO",
        "motivo": "Me arrepentí de la compra"
    }
    
    response = cliente_client.post(f"/api/v1/pedidos/{pedido.id}/cancel", json=payload)
    
    assert response.status_code == 200
    assert response.json()["estado_codigo"] == "CANCELADO"
    
    
def test_cancelar_ajeno_prohibido(admin_client, cliente_client, db_session, pedido_factory):
    usuario_admin = db_session.exec(select(Usuario).where(Usuario.username == "admin_user")).first()
    pedido = pedido_factory(usuario_id=usuario_admin.id, estado="PENDIENTE")
    
    payload = {
        "estado_hacia": "CANCELADO",
        "motivo": "Intento de cancelación maliciosa"
    }

    response = cliente_client.post(f"/api/v1/pedidos/{pedido.id}/cancel", json=payload)

    assert response.status_code == 403