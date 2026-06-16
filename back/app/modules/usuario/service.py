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

from app.core.exceptions.custom_exceptions import ResourceNotFoundError, DuplicateResourceError, BusinessRuleError, AuthenticationError

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
            raise DuplicateResourceError(
                message="El nombre de usuario ya está en uso",
                resource="usuario",
                field="username",
                value=user_in.username,
            )

        if self.uow.usuarios.get_by_email(user_in.email):
            raise DuplicateResourceError(
                message="El email ya está registrado",
                resource="usuario",
                field="email",
                value=user_in.email,
            )

        client_role = self.uow.roles.get_by_codigo("CLIENT")
        if client_role is None:
            raise ResourceNotFoundError(
                resource="rol",
                identifier="CLIENT",
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
            raise DuplicateResourceError(
                message="El nombre de usuario ya está en uso",
                resource="usuario",
                field="username",
                value=user_in.username,
            )

        if self.uow.usuarios.get_by_email(user_in.email):
            raise DuplicateResourceError(
                message="El email ya está registrado",
                resource="usuario",
                field="email",
                value=user_in.email,
            )
        if not user_in.roles:
            raise BusinessRuleError(
                message="Debe asignar al menos un rol al trabajador",
            )

        roles = []
        for rol_codigo in user_in.roles:
            rol_codigo = rol_codigo.upper()
            role = self.uow.roles.get_by_codigo(rol_codigo)
            if role is None:
                raise ResourceNotFoundError(
                    resource="rol",
                    identifier=rol_codigo,
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
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=usuario_db.id,
            )

        return UserPublic.model_validate(updated_user)

    def authenticate(self, username: str, password: str) -> Token:
        """Autentica con username + password y retorna un Token con JWT."""
        user = self.uow.usuarios.get_by_username(username)

        if not user or not verify_password(password, user.hashed_password):
            raise AuthenticationError(
                message="Credenciales incorrectas",
            )

        if user.disabled:
            raise BusinessRuleError(
                message="Cuenta de usuario desactivada",
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
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=user_id,
            )
        return user
    
    def get_user_by_id_name(self, user_id: int) -> Usuario:
        user = self.uow.usuarios.get_by_id_name(user_id)
        if not user:
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=user_id,
            )
        return user



    def set_disabled(self, user_id: int, disabled: bool) -> Usuario:
        """Activa o desactiva la cuenta de un usuario."""
        user = self.uow.usuarios.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=user_id,
            )
        user.disabled = disabled
        user.deleted_at = datetime.now(timezone.utc) if disabled else None
        return self.uow.usuarios.update(user)

    def asignar_rol(self, user_id: int, rol_codigo: str, admin_id: int) -> Usuario:
        
        user = self.uow.usuarios.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=user_id,
            )

        rol_codigo = rol_codigo.upper()
        role = self.uow.roles.get_by_codigo(rol_codigo)
        if role is None:
            raise ResourceNotFoundError(
                resource="rol",
                identifier=rol_codigo,
            )

        existing_link = self.uow.usuarios_roles.get(user_id, rol_codigo)
        if existing_link:
            if existing_link.asignado_por is None:
                existing_link.asignado_por = admin_id
                self.uow.usuarios_roles.update(existing_link)

            updated_user = self.uow.usuarios.get_by_id(user_id)
            if updated_user is None:
                raise ResourceNotFoundError(
                    resource="usuario",
                    identifier=user_id,
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
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=user_id,
            )
        return updated_user

    def desasignar_rol(self, user_id: int, rol_codigo: str) -> Usuario:
        user = self.uow.usuarios.get_by_id(user_id)
        if not user:
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=user_id,
            )

        rol_codigo = rol_codigo.upper()
        role = self.uow.roles.get_by_codigo(rol_codigo)
        if role is None:
            raise ResourceNotFoundError(
                resource="rol",
                identifier=rol_codigo,
            )

        existing_link = self.uow.usuarios_roles.get(user_id, rol_codigo)
        if existing_link is None:
            raise BusinessRuleError(
                message=f"El usuario no tiene asignado el rol '{rol_codigo}'",
            )

        self.uow.usuarios_roles.delete(existing_link)

        updated_user = self.uow.usuarios.get_by_id(user_id)
        if updated_user is None:
            raise ResourceNotFoundError(
                resource="usuario",
                identifier=user_id,
            )
        return updated_user
