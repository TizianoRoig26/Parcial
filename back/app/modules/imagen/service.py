import asyncio
import cloudinary
import cloudinary.uploader
import logging
from fastapi import UploadFile
from sqlmodel import Session
from app.core.exceptions.custom_exceptions import BusinessRuleError

from app.core.config import settings
from app.modules.imagen.models import Imagen
from app.modules.imagen.schemas import ImagenPublic
from app.modules.imagen.unit_of_work import ImagenUnitOfWork

logger = logging.getLogger(__name__)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

MAX_FILE_SIZE = 5 * 1024 * 1024  

class ImagenService:

    def __init__(self, session: Session) -> None:
        self._session = session

    async def upload_image(self, file: UploadFile) -> ImagenPublic:
        if file.content_type not in ALLOWED_TYPES:
            raise BusinessRuleError(
                message=f"Tipo de archivo inválido: {file.content_type}. Se requiere image/jpeg, image/png o image/webp.",
            )
            
        content = await file.read()
        
        if len(content) > MAX_FILE_SIZE:
            raise BusinessRuleError(
                message="El archivo excede el tamaño máximo permitido de 5 MB.",
            )
            
        upload_result = await asyncio.to_thread(
            cloudinary.uploader.upload,
            content,
            folder="foodstore/productos",
            allowed_formats=["jpg", "jpeg", "png", "webp"],
            overwrite=False,
            unique_filename=True,
            resource_type="image",
        )
        
        imagen = Imagen(
            public_id=upload_result["public_id"],
            url=upload_result["secure_url"],
            filename=file.filename or upload_result["public_id"],
            format=upload_result.get("format"),
            width=upload_result.get("width"),
            height=upload_result.get("height"),
            bytes=upload_result.get("bytes"),
        )
        
        with ImagenUnitOfWork(self._session) as uow:
            saved = uow.imagenes.add(imagen)
            return ImagenPublic.model_validate(saved)

    def delete_by_public_id(self, public_id: str) -> None:

        try:
            cloudinary.uploader.destroy(public_id, resource_type="image")
        except Exception as e:
            logger.error(f"Error al eliminar imagen de Cloudinary: {e}")
            raise BusinessRuleError(message="Error al eliminar imagen de Cloudinary")

        with ImagenUnitOfWork(self._session) as uow:
            imagen = uow.imagenes.get_by_public_id(public_id)
            if imagen:
                uow.imagenes.delete(imagen)