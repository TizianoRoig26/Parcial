import pytest
import time
from unittest.mock import patch
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient
from starlette.middleware.cors import CORSMiddleware
from app.core.middleware.logging_middleware import LoggingMiddleware

@pytest.fixture(scope="function")
def test_app():
    app = FastAPI()
    
    # Agregar LoggingMiddleware primero
    app.add_middleware(LoggingMiddleware)
    
    # Agregar CORSMiddleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:5174"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/test-endpoint")
    def test_endpoint(request: Request):
        return {"request_id": getattr(request.state, "request_id", None)}

    @app.post("/api/v1/auth/token")
    def mock_login(status_code: int = 200):
        return Response(
            content='{"message":"mocked"}',
            status_code=status_code,
            media_type="application/json"
        )

    return app


@pytest.fixture(scope="function", autouse=True)
def clean_rate_limit_state():
    # Asegurar que el estado del rate limit esté limpio antes de cada test
    LoggingMiddleware._attempts_by_ip.clear()
    LoggingMiddleware._blocked_until.clear()


def test_request_id_in_response_headers(test_app):
    client = TestClient(test_app)
    response = client.get("/test-endpoint")
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    # Verificar que el request_id retornado en el body coincide con el header
    data = response.json()
    assert data["request_id"] == response.headers["X-Request-ID"]


def test_excluded_paths(test_app):
    # /health está en EXCLUDED_PATHS
    client = TestClient(test_app)
    response = client.get("/health")
    assert response.status_code == 200
    # Aunque esté excluida del logging, el middleware sigue procesando o no?
    # En LoggingMiddleware.dispatch:
    #   if request.url.path in self.EXCLUDED_PATHS:
    #       return await call_next(request)
    # Por lo tanto, no se le añade X-Request-ID en el response header si se sale antes.
    # Veamos si no tiene la cabecera X-Request-ID
    assert "X-Request-ID" not in response.headers


def test_cors_headers(test_app):
    client = TestClient(test_app)
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    response = client.get("/test-endpoint", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_login_rate_limiting_flow(test_app):
    client = TestClient(test_app)
    
    # Realizar 5 intentos fallidos (status 401)
    for i in range(5):
        response = client.post("/api/v1/auth/token?status_code=401")
        assert response.status_code == 401
    
    # El 6to intento debe fallar con 429 (Too Many Requests)
    response_blocked = client.post("/api/v1/auth/token?status_code=200")
    assert response_blocked.status_code == 429
    assert "Retry-After" in response_blocked.headers
    assert int(response_blocked.headers["Retry-After"]) > 0


def test_login_rate_limiting_ip_isolation(test_app):
    client = TestClient(test_app)
    
    # 5 intentos fallidos desde la IP 1
    for _ in range(5):
        client.post("/api/v1/auth/token?status_code=401", headers={"X-Forwarded-For": "1.1.1.1"})
    
    # El 6to de la IP 1 está bloqueado
    res_ip1 = client.post("/api/v1/auth/token?status_code=200", headers={"X-Forwarded-For": "1.1.1.1"})
    assert res_ip1.status_code == 429

    # IP 2 debe poder realizar peticiones con normalidad (aislamiento de IP)
    res_ip2 = client.post("/api/v1/auth/token?status_code=200", headers={"X-Forwarded-For": "2.2.2.2"})
    assert res_ip2.status_code == 200


def test_login_rate_limiting_reset_on_success(test_app):
    client = TestClient(test_app)
    
    # 3 intentos fallidos
    for _ in range(3):
        client.post("/api/v1/auth/token?status_code=401")
    
    # 1 intento exitoso
    res_success = client.post("/api/v1/auth/token?status_code=200")
    assert res_success.status_code == 200

    # 3 intentos fallidos más (no deberían bloquear, porque el contador se reseteó a 0)
    for _ in range(3):
        res = client.post("/api/v1/auth/token?status_code=401")
        assert res.status_code == 401

    # Un 4to intento fallido
    res = client.post("/api/v1/auth/token?status_code=401")
    assert res.status_code == 401

    # Todavía no está bloqueado (van 4 fallidos consecutivos)
    res_ok = client.post("/api/v1/auth/token?status_code=200")
    assert res_ok.status_code == 200


def test_login_rate_limiting_block_expiry(test_app):
    client = TestClient(test_app)
    
    # Bloquear la IP
    for _ in range(5):
        client.post("/api/v1/auth/token?status_code=401", headers={"X-Forwarded-For": "3.3.3.3"})
        
    res_blocked = client.post("/api/v1/auth/token?status_code=200", headers={"X-Forwarded-For": "3.3.3.3"})
    assert res_blocked.status_code == 429
    
    # Avanzar el tiempo simulado más allá de BLOCK_SECONDS (900 segundos)
    now = time.monotonic()
    future_time = now + 901
    
    with patch("time.monotonic", return_value=future_time):
        # Intentar nuevamente, debería permitir la petición y limpiar el bloqueo
        res_after_block = client.post("/api/v1/auth/token?status_code=200", headers={"X-Forwarded-For": "3.3.3.3"})
        assert res_after_block.status_code == 200
