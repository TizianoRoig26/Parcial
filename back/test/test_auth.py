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


def test_patch_propio_usuario(client, db_session):
    # 1. Registrar usuario
    client.post("/api/v1/auth/register", json=USUARIO_TEST)
    
    # 2. Login para obtener la cookie de autenticación
    login_resp = client.post(
        "/api/v1/auth/token",
        data={
            "username": USUARIO_TEST["username"],
            "password": USUARIO_TEST["password"]
        }
    )
    assert login_resp.status_code == 200

    # 3. Obtener el id del usuario llamando a /me
    me_resp = client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200
    user_id = me_resp.json()["id"]

    # 4. Hacer PATCH en el propio perfil
    patch_data = {
        "full_name": "Luca Modificado",
        "celular": "9988776655"
    }
    patch_resp = client.patch(f"/api/v1/auth/usuarios/{user_id}", json=patch_data)
    assert patch_resp.status_code == 200
    data = patch_resp.json()
    assert data["full_name"] == "Luca Modificado"
    assert data["celular"] == "9988776655"
    assert data["username"] == USUARIO_TEST["username"]


def test_patch_usuario_ajeno(client, db_session):
    # 1. Registrar dos usuarios
    user1 = USUARIO_TEST.copy()
    user2 = USUARIO_TEST.copy()
    user2["username"] = "otro_user"
    user2["email"] = "otro@example.com"
    
    client.post("/api/v1/auth/register", json=user1)
    client.post("/api/v1/auth/register", json=user2)
    
    # 2. Login como user1
    client.post(
        "/api/v1/auth/token",
        data={
            "username": user1["username"],
            "password": user1["password"]
        }
    )

    # 3. Obtener id de user1
    me_resp = client.get("/api/v1/auth/me")
    user1_id = me_resp.json()["id"]
    
    # Suponiendo que user2_id es user1_id + 1
    otro_id = user1_id + 1
    
    # 4. Intentar modificar el perfil de user2 (debería dar 403)
    patch_data = {"full_name": "Intruso"}
    patch_resp = client.patch(f"/api/v1/auth/usuarios/{otro_id}", json=patch_data)
    assert patch_resp.status_code == 403
    assert patch_resp.json()["error"]["code"] == "authorization_error"


def test_patch_usuario_duplicado(client, db_session):
    # 1. Registrar dos usuarios
    user1 = USUARIO_TEST.copy()
    user2 = USUARIO_TEST.copy()
    user2["username"] = "otro_user"
    user2["email"] = "otro@example.com"
    
    client.post("/api/v1/auth/register", json=user1)
    client.post("/api/v1/auth/register", json=user2)
    
    # 2. Login como user1
    client.post(
        "/api/v1/auth/token",
        data={
            "username": user1["username"],
            "password": user1["password"]
        }
    )

    # 3. Obtener id de user1
    me_resp = client.get("/api/v1/auth/me")
    user1_id = me_resp.json()["id"]

    # 4. Intentar modificar username de user1 al de user2 (debería dar 409)
    patch_resp = client.patch(
        f"/api/v1/auth/usuarios/{user1_id}",
        json={"username": "otro_user"}
    )
    assert patch_resp.status_code == 409