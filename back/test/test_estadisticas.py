import pytest
from datetime import date, timedelta
from sqlmodel import select
from app.modules.usuario.model import Usuario
from app.modules.pedido.models import Pedido

@pytest.fixture(scope="function", autouse=True)
def setup_pedidos_estadisticas(db_session, pedido_factory, admin_client): 

    usuario = db_session.exec(select(Usuario).where(Usuario.username == "admin_user")).first()
    

    if not usuario:
        usuario = db_session.exec(select(Usuario)).first()

    p1 = pedido_factory(usuario_id=usuario.id, estado="ENTREGADO")
    p1.pagado = True

    p2 = pedido_factory(usuario_id=usuario.id, estado="CONFIRMADO")
    p2.pagado = True

    p3 = pedido_factory(usuario_id=usuario.id, estado="PENDIENTE")
    p3.pagado = False

    p4 = pedido_factory(usuario_id=usuario.id, estado="CANCELADO")
    p4.pagado = True

    db_session.add_all([p1, p2, p3, p4])
    db_session.commit()


def test_estadisticas_resumen_ok(admin_client):

    response = admin_client.get("/api/v1/estadisticas/resumen")

    assert response.status_code == 200
    data = response.json()
    assert float(data["ventas_hoy"]) > 0
    assert float(data["ticket_promedio"]) > 0

    assert data["pedidos_activos"] == 2

    assert float(data["total_mes_actual"]) > 0
    assert data["cantidad_pedidos_mes"] == 2 


def test_estadisticas_ventas_por_periodo(admin_client):

    hoy = date.today()
    desde = hoy - timedelta(days=5)
    hasta = hoy + timedelta(days=5)
    
    response = admin_client.get(f"/api/v1/estadisticas/ventas?desde={desde}&hasta={hasta}&agrupacion=day")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert float(data[0]["total_ventas"]) > 0


def test_estadisticas_productos_top(admin_client):

    response = admin_client.get("/api/v1/estadisticas/productos-top?limit=5")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "nombre" in data[0]
    assert float(data[0]["total_ventas"]) > 0


def test_estadisticas_pedidos_por_estado(admin_client):

    response = admin_client.get("/api/v1/estadisticas/pedidos-por-estado")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    
    estados_devueltos = [item["estado_codigo"] for item in data]
    
    assert "ENTREGADO" in estados_devueltos
    assert "CANCELADO" in estados_devueltos
    assert "PENDIENTE" in estados_devueltos


def test_estadisticas_ingresos_forma_pago(admin_client):
    hoy = date.today()
    desde = hoy - timedelta(days=5)
    hasta = hoy + timedelta(days=5)
    
    response = admin_client.get(f"/api/v1/estadisticas/ingresos?desde={desde}&hasta={hasta}")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["nombre"] == "EFECTIVO" 
    assert float(data[0]["total_ventas"]) > 0