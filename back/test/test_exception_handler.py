import pytest
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.testclient import TestClient
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.exceptions.custom_exceptions import (
    AppError,
    ResourceNotFoundError,
    DuplicateResourceError,
    BusinessRuleError,
    AuthenticationError,
    AuthorizationError,
    RateLimitExceededError,
)
from app.core.exceptions.exceptions_handlers import register_exception_handlers
from app.core.middleware.logging_middleware import LoggingMiddleware

@pytest.fixture(scope="function")
def test_exc_app():
    app = FastAPI()
    
    app.add_middleware(LoggingMiddleware)
    

    register_exception_handlers(app)
    
    @app.get("/resource-not-found")
    def trigger_resource_not_found():
        raise ResourceNotFoundError(resource="usuario", identifier=42)
        
    @app.get("/duplicate-resource")
    def trigger_duplicate_resource():
        raise DuplicateResourceError(resource="usuario", field="email", value="test@example.com")
        
    @app.get("/business-rule")
    def trigger_business_rule():
        raise BusinessRuleError("No se puede realizar esta acción.")
        
    @app.get("/auth-error")
    def trigger_auth_error():
        raise AuthenticationError("Token inválido.")
        
    @app.get("/authz-error")
    def trigger_authz_error():
        raise AuthorizationError("Permisos insuficientes.")
        
    @app.get("/rate-limit-error")
    def trigger_rate_limit_error():
        raise RateLimitExceededError("Demasiadas peticiones.", retry_after=120)
        
    @app.get("/http-exception")
    def trigger_http_exception():
        raise HTTPException(status_code=400, detail="Mala petición HTTP.")
        
    class DummyModel(BaseModel):
        name: str
        age: int = Field(gt=0)
        
    @app.post("/validation-error")
    def trigger_validation_error(model: DummyModel):
        return {"ok": True}
        
    @app.get("/integrity-error")
    def trigger_integrity_error():
        raise IntegrityError("INSERT INTO table ...", {}, Exception("Duplicate key"))
        
    @app.get("/sqlalchemy-error")
    def trigger_sqlalchemy_error():
        raise SQLAlchemyError("Generic database error")
        
    @app.get("/unhandled-error")
    def trigger_unhandled_error():
        raise ValueError("Something unexpected happened")
        
    return app


def test_resource_not_found_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/resource-not-found")
    assert response.status_code == 404
    
    data = response.json()
    assert "detail" in data
    assert "error" in data
    err = data["error"]
    assert err["code"] == "not_found"
    assert "No se encontró el usuario con identificador '42'." in err["message"]
    assert err["request_id"] == response.headers["X-Request-ID"]
    assert "timestamp" in err


def test_duplicate_resource_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/duplicate-resource")
    assert response.status_code == 409
    
    data = response.json()
    assert "detail" in data
    assert "error" in data
    err = data["error"]
    assert err["code"] == "duplicate_resource"
    assert "Ya existe un usuario con email='test@example.com'." in err["message"]
    assert err["request_id"] == response.headers["X-Request-ID"]


def test_business_rule_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/business-rule")
    assert response.status_code == 400
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "business_rule_violation"
    assert err["message"] == "No se puede realizar esta acción."


def test_auth_error_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/auth-error")
    assert response.status_code == 401
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "authentication_error"
    assert err["message"] == "Token inválido."


def test_authz_error_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/authz-error")
    assert response.status_code == 403
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "authorization_error"
    assert err["message"] == "Permisos insuficientes."


def test_rate_limit_error_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/rate-limit-error")
    assert response.status_code == 429
    
    assert response.headers.get("Retry-After") == "120"
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "rate_limit_exceeded"
    assert err["message"] == "Demasiadas peticiones."


def test_http_exception_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/http-exception")
    assert response.status_code == 400
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "bad_request"
    assert err["message"] == "Mala petición HTTP."


def test_validation_error_handler(test_exc_app):
    client = TestClient(test_exc_app)

    response = client.post("/validation-error", json={"name": 123, "age": -5})
    assert response.status_code == 422
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "validation_error"
    assert err["message"] == "Los datos enviados no son válidos"
    
    assert "fields" in err
    fields = err["fields"]

    age_error = next((f for f in fields if f["field"] == "body.age"), None)
    assert age_error is not None
    assert age_error["type"] == "greater_than"


def test_integrity_error_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/integrity-error")
    assert response.status_code == 409
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "duplicate_resource"
    assert err["message"] == "La operación viola una restricción de unicidad o integridad."


def test_sqlalchemy_error_handler(test_exc_app):
    client = TestClient(test_exc_app)
    response = client.get("/sqlalchemy-error")
    assert response.status_code == 500
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "database_error"
    assert err["message"] == "Error de base de datos. Contacta al administrador."


def test_unhandled_exception_handler(test_exc_app):
    client = TestClient(test_exc_app, raise_server_exceptions=False)
    response = client.get("/unhandled-error")
    assert response.status_code == 500
    
    data = response.json()
    err = data["error"]
    assert err["code"] == "internal_error"
    assert err["message"] == "Error interno del servidor. El equipo ha sido notificado."

