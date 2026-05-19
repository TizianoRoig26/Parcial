from sqlmodel import Session, select
from app.core.database import engine
from app.modules.direccion.service import DireccionService
from app.modules.direccion.schemas import DireccionCreate
from app.modules.usuario.model import Usuario
import traceback

try:
    with Session(engine) as s:
        user = s.exec(select(Usuario).where(Usuario.username=="cliente")).first()
        if user:
            print(f"user: {user.username} id: {user.id}")
            svc = DireccionService(s)
            data = DireccionCreate(linea1="Test 123", ciudad="TestCity")
            res = svc.create(user.id, data)
            print(f"created: {res}")
            s.commit()
        else:
            print("User 'cliente' not found")
except Exception:
    traceback.print_exc()
