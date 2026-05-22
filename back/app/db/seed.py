from sqlalchemy import inspect
from sqlmodel import Session, select

from app.core.database import create_db_and_tables, engine
from app.core.security import hash_password
from app.modules.categoria.models import Categoria
from app.modules.direccion.model import DireccionEntrega
from app.modules.ingerediente.models import Ingrediente
from app.modules.pedido.models import EstadoPedido, FormaPago
from app.modules.producto.links import ProductoCategoria, ProductoIngrediente
from app.modules.producto.models import Producto
from app.modules.unidadMedida.models import UnidadMedida
from app.modules.usuario.model import Usuario
from app.modules.usuario.rol import Rol
from app.modules.usuario.usuario_rol import UsuarioRol


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
		{
			"username": "cliente",
			"full_name": "Usuario Cliente",
			"email": "cliente@example.com",
			"password": "clientepass",
			"roles": ["CLIENT"],
			"direccion": {
				"alias": "Casa",
				"linea1": "Av. Siempre Viva 742",
				"ciudad": "Springfield",
				"provincia": "Buenos Aires",
				"codigo_postal": "1234",
				"es_principal": True,
			},
		},
	]

	UNIDAD_MEDIDA_INICIALES = [
		{"simbolo": "kg", "nombre": "kilogramo", "tipo": "masa"},
		{"simbolo": "g", "nombre": "gramo", "tipo": "masa"},
		{"simbolo": "mL", "nombre": "mililitro", "tipo": "volumen"},
		{"simbolo": "L", "nombre": "litro", "tipo": "volumen"},
		{"simbolo": "doc", "nombre": "docena", "tipo": "unidad"},
		{"simbolo": "u", "nombre": "pieza", "tipo": "unidad"},
		{"simbolo": "m2", "nombre": "metro cuadrado", "tipo": "area"},
	]

	with Session(engine) as session:
		direccion_columns = {
			column["name"] for column in inspect(engine).get_columns("direcciones_entrega")
		}

		for u in usuarios:
			usuario = session.exec(
				select(Usuario).where(Usuario.username == u["username"])
			).first()

			role_objs = []
			for code in u["roles"]:
				r = session.exec(select(Rol).where(Rol.codigo == code)).first()
				if r:
					role_objs.append(r)

			if usuario is None:
				usuario = Usuario(
					username=u["username"],
					full_name=u["full_name"],
					email=u["email"],
					hashed_password=hash_password(u["password"]),
				)
				session.add(usuario)
				session.flush()

			usuario.roles = role_objs

			direccion = u.get("direccion")
			if direccion and "usuario_id" in direccion_columns:
				session.add(
					DireccionEntrega(
						usuario_id=usuario.id,
						alias=direccion.get("alias"),
						linea1=direccion["linea1"],
						ciudad=direccion["ciudad"],
						provincia=direccion.get("provincia"),
						codigo_postal=direccion.get("codigo_postal"),
						es_principal=direccion.get("es_principal", False),
					)
				)
			elif direccion:
				print("  [!] Se omitió la dirección porque la tabla direcciones_entrega no tiene usuario_id")

		for data in UNIDAD_MEDIDA_INICIALES:
			existing = session.exec(
				select(UnidadMedida).where(UnidadMedida.simbolo == data["simbolo"])
			).first()

			if existing:
				print(f"  [=] Ya existe: {data['simbolo']}")
			else:
				unidad_medida = UnidadMedida(
					nombre=data["nombre"],
					simbolo=data["simbolo"],
					tipo=data["tipo"],
				)
				session.add(unidad_medida)
				print(f"  [+] Creado: {data['simbolo']} / {data['nombre']} ({data['tipo']})")

		session.commit()


def seed_formas_pago() -> None:
	create_db_and_tables()

	formas_pago = [
		FormaPago(codigo="MERCADOPAGO", descripcion="Checkout API · CardPayment SDK", habilitado=True),
		FormaPago(codigo="EFECTIVO", descripcion="retiro en local", habilitado=True),
		FormaPago(codigo="TRANSFERENCIA", descripcion="bancaria", habilitado=True),
	]

	with Session(engine) as session:
		existing = {forma.codigo for forma in session.exec(select(FormaPago)).all()}

		for forma in formas_pago:
			if forma.codigo not in existing:
				session.add(forma)

		session.commit()


def seed_estados_pedido() -> None:
	create_db_and_tables()

	estados_pedido = [
		EstadoPedido(codigo="PENDIENTE", descripcion="Pendiente de confirmación", orden=1, es_terminal=False),
		EstadoPedido(codigo="CONFIRMADO", descripcion="Pedido confirmado", orden=2, es_terminal=False),
		EstadoPedido(codigo="EN_PREP", descripcion="En preparación", orden=3, es_terminal=False),
		EstadoPedido(codigo="EN_CAMINO", descripcion="En camino", orden=4, es_terminal=False),
		EstadoPedido(codigo="ENTREGADO", descripcion="Entregado", orden=5, es_terminal=True),
		EstadoPedido(codigo="CANCELADO", descripcion="Cancelado", orden=6, es_terminal=True),
	]

	with Session(engine) as session:
		existing = {estado.codigo for estado in session.exec(select(EstadoPedido)).all()}

		for estado in estados_pedido:
			if estado.codigo not in existing:
				session.add(estado)

		session.commit()


def seed_pedido_catalogos() -> None:
	seed_formas_pago()
	seed_estados_pedido()


if __name__ == "__main__":
	seed_roles()
	seed_pedido_catalogos()
