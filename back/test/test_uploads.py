import pytest
from unittest.mock import patch, MagicMock
from io import BytesIO
from fastapi import UploadFile
from app.modules.imagen.service import ImagenService
from app.modules.imagen.models import Imagen
from sqlmodel import select

@pytest.fixture
def mock_cloudinary():
    with patch("cloudinary.uploader.upload") as mock_upload, \
         patch("cloudinary.uploader.destroy") as mock_destroy:
        
        # Simular resultado de subida exitosa
        mock_upload.return_value = {
            "public_id": "foodstore/productos/test_image",
            "secure_url": "https://res.cloudinary.com/demo/image/upload/v12345/foodstore/productos/test_image.jpg",
            "format": "jpg",
            "width": 800,
            "height": 600,
            "bytes": 50000
        }
        # Simular borrado exitoso
        mock_destroy.return_value = {"result": "ok"}
        
        yield mock_upload, mock_destroy

@pytest.mark.anyio
async def test_upload_image_ok(admin_client, db_session, mock_cloudinary):
    mock_upload, _ = mock_cloudinary

    # 1. Crear un archivo simulado en memoria
    file_content = b"fake image content"
    file = UploadFile(
        filename="test.jpg",
        file=BytesIO(file_content),
        headers={"content-type": "image/jpeg"}
    )

    # 2. Instanciar servicio y subir imagen
    service = ImagenService(db_session)
    result = await service.upload_image(file)

    # 3. Validar resultados en base de datos e indirectos
    assert result.public_id == "foodstore/productos/test_image"
    assert result.url == "https://res.cloudinary.com/demo/image/upload/v12345/foodstore/productos/test_image.jpg"
    
    # Verificar que el registro está persistido en la BD
    db_session.expire_all()
    imagen_db = db_session.exec(select(Imagen).where(Imagen.public_id == result.public_id)).first()
    assert imagen_db is not None
    assert imagen_db.filename == "test.jpg"

    # Verificar que se llamó al SDK de Cloudinary
    mock_upload.assert_called_once()

def test_upload_image_mime_invalid(admin_client, db_session):
    # Intentar subir un archivo con MIME de texto
    file = UploadFile(
        filename="test.txt",
        file=BytesIO(b"fake text content"),
        headers={"content-type": "text/plain"}
    )
    service = ImagenService(db_session)
    
    with pytest.raises(Exception) as exc:
        import asyncio
        asyncio.run(service.upload_image(file))
    
    assert "Tipo de archivo inválido" in str(exc.value)

@pytest.mark.anyio
async def test_upload_image_size_exceeded(admin_client, db_session):
    # Intentar subir un archivo que excede los 5MB
    large_content = b"0" * (5 * 1024 * 1024 + 1)
    file = UploadFile(
        filename="large.jpg",
        file=BytesIO(large_content),
        headers={"content-type": "image/jpeg"}
    )
    service = ImagenService(db_session)

    with pytest.raises(Exception) as exc:
        await service.upload_image(file)
    
    assert "excede el tamaño máximo" in str(exc.value)

def test_delete_image_ok(admin_client, db_session, mock_cloudinary):
    _, mock_destroy = mock_cloudinary

    # 1. Crear y persistir registro local en la BD
    imagen = Imagen(
        public_id="foodstore/productos/to_delete",
        url="https://res.cloudinary.com/demo/image/upload/to_delete.jpg",
        filename="to_delete.jpg"
    )
    db_session.add(imagen)
    db_session.commit()

    # 2. Eliminar imagen a través del servicio
    service = ImagenService(db_session)
    service.delete_by_public_id("foodstore/productos/to_delete")

    # 3. Verificar borrado
    mock_destroy.assert_called_once_with("foodstore/productos/to_delete", resource_type="image")
    
    db_session.expire_all()
    imagen_db = db_session.exec(select(Imagen).where(Imagen.public_id == "foodstore/productos/to_delete")).first()
    assert imagen_db is None

def test_router_upload_endpoint(admin_client, mock_cloudinary):
    # Testear la integración mediante el TestClient
    file_content = b"fake jpeg bytes"
    files = {"file": ("test.jpg", BytesIO(file_content), "image/jpeg")}
    
    response = admin_client.post("/api/v1/imagenes/imagen", files=files)
    
    assert response.status_code == 201
    data = response.json()
    assert data["public_id"] == "foodstore/productos/test_image"
