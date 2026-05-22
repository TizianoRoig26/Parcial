from typing import List, TYPE_CHECKING

from sqlalchemy import Text
from sqlmodel import SQLModel, Field, Relationship

from app.modules.usuario.usuario_rol import UsuarioRol

if TYPE_CHECKING:
    from app.modules.usuario.model import Usuario


class Rol(SQLModel, table=True):
    __tablename__ = "roles"

    codigo: str = Field(primary_key=True, max_length=20)
    nombre: str = Field(unique=True, max_length=50, nullable=False)
    descripcion: str | None = Field(default=None, sa_type=Text)

    usuarios: List["Usuario"] = Relationship(
        back_populates="roles",
        link_model=UsuarioRol,
        sa_relationship_kwargs={
            "overlaps": "usuario,rol",
            "foreign_keys": "[UsuarioRol.usuario_id, UsuarioRol.rol_codigo]",
        },
    )
