"""
Service de Usuario — lógica de negocio.

Stateless, orquesta operaciones sobre los repositorios a través del UoW.
Lanza HTTPException. No hace commit/rollback directamente.

Capa: Service
Conoce a: UoW, Repository (indirectamente vía UoW)
NO conoce a: Router

Regla de imports:
    Router → Service → UoW → Repository → Model
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.modules.usuario.unit_of_work import UsuariosUnitOfWork
from app.modules.usuario.model import Usuario
from app.modules.usuario.schemas import UserCreate, UserCreateTrabajador, Token, UserPublic
from app.modules.usuario.usuario_rol import UsuarioRol


class UsuarioService:
    """Lógica de negocio para autenticación y gestión de usuarios."""

    def __init__(self, uow: UsuariosUnitOfWork):
        self.uow = uow

    def register(self, user_in: UserCreate):
        """Registra un nuevo usuario con el rol CLIENT por defecto."""
        if self.uow.usuarios.get_by_username(user_in.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya está en uso",
            )

        if self.uow.usuarios.get_by_email(user_in.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )

        client_role = self.uow.roles.get_by_codigo("CLIENT")
        if client_role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No existe el rol CLIENT en el catálogo",
            )

        usuario = Usuario(
            username=user_in.username,
            full_name=user_in.full_name,
            email=user_in.email,
            hashed_password=hash_password(user_in.password),
        )
        usuario.roles = [client_role]

        rta = UserPublic.model_validate(self.uow.usuarios.add(usuario))
        return rta
    
    def register_trabajador(self, user_in: UserCreateTrabajador, admin_id: int) -> UserPublic:
        if self.uow.usuarios.get_by_username(user_in.username):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El nombre de usuario ya está en uso",
            )

        if self.uow.usuarios.get_by_email(user_in.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El email ya está registrado",
            )
        if not user_in.roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Debe asignar al menos un rol al trabajador",
            )

        roles = []
        for rol_codigo in user_in.roles:
            rol_codigo = rol_codigo.upper()
            role = self.uow.roles.get_by_codigo(rol_codigo)
            if role is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No existe el rol '{rol_codigo}'",
                )
            roles.append(role)

        usuario = Usuario(
            username=user_in.username,
            full_name=user_in.full_name,
            email=user_in.email,
            hashed_password=hash_password(user_in.password),
        )

        usuario_db = self.uow.usuarios.add(usuario)

        for role in roles:
            self.uow.usuarios_roles.add(
                UsuarioRol(
                    usuario_id=usuario_db.id,
                    rol_codigo=role.codigo,
                    asignado_por=admin_id,
                )
            )

        updated_user = self.uow.usuarios.get_by_id(usuario_db.id)
        if updated_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        return UserPublic.model_validate(updated_user)

    def authenticate(self, username: str, password: str) -> Token:
        """Autentica con username + password y retorna un Token con JWT."""
        user = self.uow.usuarios.get_by_username(username)

        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if user.disabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cuenta de usuario desactivada",
            )

        access_token = create_access_token(
            data={"sub": user.username, "roles": user.role_codes}
        )
        return Token(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def list_all(self) -> list[Usuario]:
        """Lista todos los usuarios."""
        return self.uow.usuarios.get_all()
    
    def get_user_by_id(self, user_id: int) -> Usuario:
        user = self.uow.usuarios.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return user
    
    def get_user_by_id_name(self, user_id: int) -> Usuario:
        user = self.uow.usuarios.get_by_id_name(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return user



    def set_disabled(self, user_id: int, disabled: bool) -> Usuario:
        """Activa o desactiva la cuenta de un usuario."""
        user = self.uow.usuarios.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        user.disabled = disabled
        user.deleted_at = datetime.now(timezone.utc) if disabled else None
        return self.uow.usuarios.update(user)

    def asignar_rol(self, user_id: int, rol_codigo: str, admin_id: int) -> Usuario:
        
        user = self.uow.usuarios.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        rol_codigo = rol_codigo.upper()
        role = self.uow.roles.get_by_codigo(rol_codigo)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No existe el rol '{rol_codigo}'",
            )

        existing_link = self.uow.usuarios_roles.get(user_id, rol_codigo)
        if existing_link:
            if existing_link.asignado_por is None:
                existing_link.asignado_por = admin_id
                self.uow.usuarios_roles.update(existing_link)

            updated_user = self.uow.usuarios.get_by_id(user_id)
            if updated_user is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Usuario no encontrado",
                )
            return updated_user

        self.uow.usuarios_roles.add(
            UsuarioRol(
                usuario_id=user_id,
                rol_codigo=rol_codigo,
                asignado_por=admin_id,
            )
        )

        updated_user = self.uow.usuarios.get_by_id(user_id)
        if updated_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return updated_user

    def desasignar_rol(self, user_id: int, rol_codigo: str) -> Usuario:
        user = self.uow.usuarios.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )

        rol_codigo = rol_codigo.upper()
        role = self.uow.roles.get_by_codigo(rol_codigo)
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No existe el rol '{rol_codigo}'",
            )

        existing_link = self.uow.usuarios_roles.get(user_id, rol_codigo)
        if existing_link is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"El usuario no tiene asignado el rol '{rol_codigo}'",
            )

        self.uow.usuarios_roles.delete(existing_link)

        updated_user = self.uow.usuarios.get_by_id(user_id)
        if updated_user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            )
        return updated_user
