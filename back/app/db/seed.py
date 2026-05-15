from sqlmodel import Session, select

from app.core.database import create_db_and_tables, engine
from app.modules.usuarios.rol import Rol
from app.modules.usuarios.model import Usuario
from app.core.security import hash_password
from sqlmodel import select


def seed_roles() -> None:
    create_db_and_tables()

    roles = [
        Rol(codigo="ADMIN", nombre="Admin", descripcion="Acceso total sin restricciones"),
        Rol(codigo="STOCK", nombre="Stock", descripcion="Actualiza stock y disponible"),
        Rol(codigo="PEDIDOS", nombre="Pedidos", descripcion="Avanza estados CONFIRMADO->ENTREGADO"),
        Rol(codigo="CLIENT", nombre="Client", descripcion="Opera solo sus propios datos"),
    ]

    with Session(engine) as session:
        existing = {rol.codigo for rol in session.exec(select(Rol)).all()}

        for rol in roles:
            if rol.codigo not in existing:
                session.add(rol)

        session.commit()

    # Seed usuarios
    usuarios = [
        {
            "username": "admin",
            "full_name": "Administrador",
            "email": "admin@example.com",
            "password": "adminpass",
            "roles": ["ADMIN"],
        },
        {
            "username": "stock",
            "full_name": "Usuario Stock",
            "email": "stock@example.com",
            "password": "stockpass",
            "roles": ["STOCK"],
        },
        {
            "username": "pedidos",
            "full_name": "Usuario Pedidos",
            "email": "pedidos@example.com",
            "password": "pedidospass",
            "roles": ["PEDIDOS"],
        },
    ]

    with Session(engine) as session:
        for u in usuarios:
            exists = session.exec(select(Usuario).where(Usuario.username == u["username"]))
            if exists.first():
                continue

            # Buscar objetos Rol existentes
            role_objs = []
            for code in u["roles"]:
                r = session.exec(select(Rol).where(Rol.codigo == code)).first()
                if r:
                    role_objs.append(r)

            usuario = Usuario(
                username=u["username"],
                full_name=u["full_name"],
                email=u["email"],
                hashed_password=hash_password(u["password"]),
            )

            usuario.roles = role_objs
            session.add(usuario)

        session.commit()


if __name__ == "__main__":
    seed_roles()