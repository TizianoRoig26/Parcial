from typing import TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.modules.usuario.model import Usuario
    from app.modules.usuario.rol import Rol


class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuarios_roles"

    usuario_id: int = Field(foreign_key="usuarios.id", primary_key=True)
    rol_codigo: str = Field(foreign_key="roles.codigo", primary_key=True, max_length=20)
    asignado_por: int | None = Field(default=None, foreign_key="usuarios.id")

    usuario: "Usuario" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UsuarioRol.usuario_id]"}
    )
    rol: "Rol" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UsuarioRol.rol_codigo]"}
    )
    asignador: "Usuario" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UsuarioRol.asignado_por]"}
    )
