"""
Modelo de Usuario.

Un usuario puede tener varios roles mediante la tabla intermedia
usuarios_roles.
"""

from typing import List, TYPE_CHECKING

from sqlmodel import SQLModel, Field, Relationship

from app.modules.usuarios.usuario_rol import UsuarioRol

if TYPE_CHECKING:
    from app.modules.usuarios.rol import Rol


class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"
    id:              int | None = Field(default=None, primary_key=True)
    username:        str        = Field(index=True, unique=True)
    full_name:       str
    email:           str        = Field(index=True, unique=True)  
    hashed_password: str
    disabled:        bool       = Field(default=False)

    roles: List["Rol"] = Relationship(
        back_populates="usuarios",
        link_model=UsuarioRol,
        sa_relationship_kwargs={"overlaps": "usuario,rol"},
    )

    @property
    def role_codes(self) -> list[str]:
        return [rol.codigo for rol in self.roles]