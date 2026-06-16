"""
Modelo de Usuario.

Un usuario puede tener varios roles mediante la tabla intermedia
usuarios_roles.
"""

from datetime import datetime
from typing import List, TYPE_CHECKING, Optional

from sqlalchemy import Column, DateTime, func
from sqlmodel import SQLModel, Field, Relationship

from app.modules.direccion.model import DireccionEntrega
from app.modules.usuario.usuario_rol import UsuarioRol

if TYPE_CHECKING:
    from app.modules.usuario.rol import Rol


class Usuario(SQLModel, table=True):
    __tablename__ = "usuarios"
    id:              int | None = Field(default=None, primary_key=True)
    username:        str        = Field(index=True, unique=True)
    full_name:       str
    email:           str        = Field(index=True, unique=True)  
    celular:         Optional[str] = Field(default=None, nullable=True)
    hashed_password: str
    disabled:        bool       = Field(default=False)
    

    roles: List["Rol"] = Relationship(
        back_populates="usuarios",
        link_model=UsuarioRol,
        sa_relationship_kwargs={
            "overlaps": "usuario,rol",
            "foreign_keys": "[UsuarioRol.usuario_id, UsuarioRol.rol_codigo]",
        },
    )

    @property
    def role_codes(self) -> list[str]:
        return [rol.codigo for rol in self.roles]
    
    direcciones: List[DireccionEntrega] = Relationship(
        back_populates="usuario",
        sa_relationship_kwargs={"overlaps": "usuario,direccion"})
    
    created_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    updated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(
            DateTime(timezone=True),
            nullable=False,
            server_default=func.now(),
            onupdate=func.now(),
        ),
    )
    deleted_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )