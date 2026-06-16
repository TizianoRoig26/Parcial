import pytest
from fastapi.testclient import TestClient

USUARIO_TEST = {
    "username": "luca_test",
    "password": "Client1234!",
    "email": "luca@example.com",
    "full_name": "Luca Test",
    "celular": "1122334455"
}

def test_register_ok(client, db_session):
    response = client.post(
        "/api/v1/auth/register",
        json=USUARIO_TEST
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == USUARIO_TEST["username"]


def test_register_usuario_duplicado(client, db_session):
    client.post("/api/v1/auth/register", json=USUARIO_TEST)
    response = client.post("/api/v1/auth/register", json=USUARIO_TEST)
    assert response.status_code == 409


def test_login_ok(client, db_session):
    client.post("/api/v1/auth/register", json=USUARIO_TEST)
    response = client.post(
        "/api/v1/auth/token",
        data={
            "username": USUARIO_TEST["username"],
            "password": USUARIO_TEST["password"]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data or response.cookies.get("access_token") is not None


def test_login_credenciales_invalidas(client, db_session):
    response = client.post(
        "/api/v1/auth/token",
        data={
            "username": "usuario_fantasma",
            "password": "wrong_password"
        }
    )
    assert response.status_code == 401


def test_logout_y_revocacion(client, db_session):
    client.post("/api/v1/auth/register", json=USUARIO_TEST)
    client.post(
        "/api/v1/auth/token",
        data={
            "username": USUARIO_TEST["username"],
            "password": USUARIO_TEST["password"]
        }
    )
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200


def test_rate_limit(client):
    credenciales_erroneas = {
        "username": "hacker_user",
        "password": "clave_falsa"
    }

    for _ in range(5):
        response = client.post("/api/v1/auth/token", data=credenciales_erroneas)
        assert response.status_code == 401

    response_bloqueada = client.post("/api/v1/auth/token", data=credenciales_erroneas)
    assert response_bloqueada.status_code == 429
    assert "retry-after" in response_bloqueada.headers
    assert int(response_bloqueada.headers["retry-after"]) <= 900