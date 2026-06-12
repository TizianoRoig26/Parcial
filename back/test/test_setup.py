from sqlmodel import text

def test_db_session_funciona(db_session):
    resultado = db_session.exec(text("SELECT 1")).first()
    assert resultado == (1,), "La base de datos de test no está respondiendo."

def test_client_funciona(client):
    assert client is not None, "El cliente de prueba no se pudo crear."