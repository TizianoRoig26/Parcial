from sqlmodel import Session, select

from app.modules.usuario.usuario_rol import UsuarioRol


class UsuarioRolRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, usuario_id: int, rol_codigo: str) -> UsuarioRol | None:
        return self.session.exec(
            select(UsuarioRol).where(
                UsuarioRol.usuario_id == usuario_id,
                UsuarioRol.rol_codigo == rol_codigo,
            )
        ).first()

    def add(self, usuario_rol: UsuarioRol) -> UsuarioRol:
        self.session.add(usuario_rol)
        self.session.flush()
        self.session.refresh(usuario_rol)
        return usuario_rol

    def update(self, usuario_rol: UsuarioRol) -> UsuarioRol:
        self.session.add(usuario_rol)
        self.session.flush()
        self.session.refresh(usuario_rol)
        return usuario_rol

    def delete(self, usuario_rol: UsuarioRol) -> None:
        self.session.delete(usuario_rol)
        self.session.flush()
