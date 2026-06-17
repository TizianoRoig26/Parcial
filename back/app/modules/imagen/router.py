from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlmodel import Session

from app.core.database import get_session
from app.modules.imagen.schemas import ImagenPublic
from app.modules.imagen.service import ImagenService


router = APIRouter(tags=["uploads"])

def get_imagen_service(session: Session = Depends(get_session)) -> ImagenService:
    return ImagenService(session)

@router.post("/imagen", response_model=ImagenPublic, status_code=status.HTTP_201_CREATED)
async def upload_image(
    file: UploadFile = File(...),
    svc: ImagenService = Depends(get_imagen_service),
):
    return await svc.upload_image(file)

@router.delete("/imagen/{public_id:path}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(public_id: str, svc: ImagenService = Depends(get_imagen_service)):
    svc.delete_by_public_id(public_id)