from sqlmodel import SQLModel, Field, Relationship


class UsuarioRol(SQLModel, table=True):
    __tablename__ = "usuarios_roles"

    usuario_id: int = Field(foreign_key="usuarios.id", primary_key=True)
    rol_codigo: str = Field(foreign_key="roles.codigo", primary_key=True, max_length=20)

    usuario: "Usuario" = Relationship()
    rol: "Rol" = Relationship()
