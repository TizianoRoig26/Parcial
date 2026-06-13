import pytest

# ─── Variables de prueba ──────────────────────────────────────────────────────
USUARIO_TEST = {
    "username": "test_user_auth",
    "full_name": "Usuario de Prueba",
    "email": "testauth@foodstore.com",
    "password": "Password123!"
}

# ─── Tests ────────────────────────────────────────────────────────────────────

def test_register_ok(client, db_session):
    """
    Verifica el registro exitoso de un usuario con el rol por defecto (CLIENT).
    """
    # Act: POST /api/v1/auth/register
    response = client.post(
        "/api/v1/auth/register",
        json=USUARIO_TEST
    )

    # Assert: status 201 y validación de datos devueltos
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == USUARIO_TEST["username"]
    assert data["email"] == USUARIO_TEST["email"]
    assert "id" in data
    
    # Validamos que no exponga la contraseña
    assert "password" not in data
    assert "hashed_password" not in data

def test_register_usuario_duplicado(client, db_session):
    """
    Verifica que no se puedan registrar dos usuarios con el mismo username.
    """
    # Arrange: Registramos el usuario por primera vez
    client.post("/api/v1/auth/register", json=USUARIO_TEST)
    
    # Act: Intentamos registrar exactamente el mismo usuario
    response = client.post("/api/v1/auth/register", json=USUARIO_TEST)
    
    # Assert: 409 Conflict
    assert response.status_code == 409
    assert response.json()["detail"] == "El nombre de usuario ya está en uso"


def test_login_ok(client, db_session):
    """
    Verifica que el login devuelva el status 200 y guarde la cookie HttpOnly.
    """
    # Arrange: Necesitamos que el usuario exista en la BD para loguearse
    client.post("/api/v1/auth/register", json=USUARIO_TEST)

    # Act: POST /api/v1/auth/token (OAuth2PasswordRequestForm usa form-data)
    response = client.post(
        "/api/v1/auth/token", 
        data={
            "username": USUARIO_TEST["username"], 
            "password": USUARIO_TEST["password"]
        }
    )

    # Assert: status 200, mensaje correcto y existencia de la cookie
    assert response.status_code == 200
    assert response.json() == {"mensaje": "Login exitoso. Sesión iniciada."}
    
    # Validamos que FastAPI haya seteado la cookie "access_token"
    assert "access_token" in response.cookies


def test_login_credenciales_invalidas(client):
    """
    Verifica que credenciales erróneas devuelvan 401 Unauthorized.
    """
    # Act: Intento de login con usuario que no existe (o clave errónea)
    response = client.post(
        "/api/v1/auth/token", 
        data={
            "username": "usuario_fantasma", 
            "password": "ClaveIncorrecta123!"
        }
    )
    
    # Assert: 401
    assert response.status_code == 401
    assert response.json()["detail"] == "Credenciales incorrectas"


def test_logout_y_revocacion(client, db_session):
    """
    Verifica el logout eliminando la cookie de sesión.
    """
    # Arrange: Registrar y Loguear al usuario para tener la cookie guardada
    client.post("/api/v1/auth/register", json=USUARIO_TEST)
    client.post(
        "/api/v1/auth/token", 
        data={
            "username": USUARIO_TEST["username"], 
            "password": USUARIO_TEST["password"]
        }
    )

    # Act: POST /api/v1/auth/logout
    response = client.post("/api/v1/auth/logout")

    # Assert: status 200 y la cookie debe estar eliminada (vacía o expirada)
    assert response.status_code == 200
    assert response.json() == {"mensaje": "Sesión cerrada exitosamente"}
    
    # FastAPI elimina cookies seteándolas sin valor o forzando expiración
    assert not response.cookies.get("access_token") 


def test_rate_limit(client):
    """
    Verifica el bloqueo por demasiados intentos de login (429 Too Many Requests).
    El middleware bloquea después de 5 intentos fallidos.
    """
    credenciales_erroneas = {
        "username": "hacker_user", 
        "password": "clave_falsa"
    }

    for _ in range(5):
        response = client.post("/api/v1/auth/token", data=credenciales_erroneas)
        assert response.status_code == 401 
        
    response_bloqueada = client.post("/api/v1/auth/token", data=credenciales_erroneas)
            
    assert response_bloqueada.status_code == 429
    
    data = response_bloqueada.json()
    assert data["detail"] == "Demasiados intentos de login. Espera antes de volver a intentar."
    
    assert "retry-after" in response_bloqueada.headers
    assert int(response_bloqueada.headers["retry-after"]) <= 30