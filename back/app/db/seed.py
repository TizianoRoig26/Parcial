import datetime
from decimal import Decimal
from sqlalchemy import inspect
from sqlmodel import Session, select, delete

from app.core.database import create_db_and_tables, engine
from app.core.security import hash_password
from app.modules.categoria.models import Categoria
from app.modules.direccion.model import DireccionEntrega
from app.modules.ingerediente.models import Ingrediente
from app.modules.pedido.models import EstadoPedido, FormaPago, Pedido, DetallePedido, HistorialEstadoPedido
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
  		Rol(codigo="COCINA", nombre="Cocina", descripcion="Prepara pedidos CONFIRMADOS a EN_PREP y a ENTREGADO"),
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
			"celular" : "12345678",
			"password": "adminpass",
			"roles": ["ADMIN"],
		},
		{
			"username": "stock",
			"full_name": "Usuario Stock",
			"email": "stock@example.com",
			"celular" : "12345678",
			"password": "stockpass",
			"roles": ["STOCK"],
		},
		{
			"username": "pedidos",
			"full_name": "Usuario Pedidos",
			"email": "pedidos@example.com",
			"celular" : "12345678",
			"password": "pedidospass",
			"roles": ["PEDIDOS"],
		},
		{
			"username": "cliente",
			"full_name": "Usuario Cliente",
			"email": "cliente@example.com",
			"celular" : "12345678",
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
					celular=u.get("celular"),
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

	seed_ingredientes()
	seed_productos()

def seed_ingredientes() -> None:
	create_db_and_tables()
	
	ingredientes_data = [
		{"nombre": "Harina de trigo", "descripcion": "Harina 0000 para panadería y pizzería", "es_alergeno": True, "stock_cantidad": 33},
		{"nombre": "Agua", "descripcion": "Agua purificada", "es_alergeno": False, "stock_cantidad": 88},
		{"nombre": "Sal", "descripcion": "Sal fina de mesa", "es_alergeno": False, "stock_cantidad": 42},
		{"nombre": "Levadura", "descripcion": "Levadura fresca para masas", "es_alergeno": False, "stock_cantidad": 124},
		{"nombre": "Aceite de oliva", "descripcion": "Aceite de oliva extra virgen", "es_alergeno": False, "stock_cantidad": 88},
		{"nombre": "Salsa de tomate", "descripcion": "Salsa de tomate triturado con especias", "es_alergeno": False, "stock_cantidad": 47},
		{"nombre": "Queso muzzarella", "descripcion": "Queso muzzarella de primera calidad", "es_alergeno": True, "stock_cantidad": 29},
		{"nombre": "Jamón cocido", "descripcion": "Fiambre de cerdo cocido", "es_alergeno": False, "stock_cantidad": 117},
		{"nombre": "Morrones asados", "descripcion": "Pimientos rojos asados y pelados", "es_alergeno": False, "stock_cantidad": 157},
		{"nombre": "Aceitunas verdes", "descripcion": "Aceitunas verdes descarozadas", "es_alergeno": False, "stock_cantidad": 163},
		{"nombre": "Cebolla", "descripcion": "Cebolla blanca fresca", "es_alergeno": False, "stock_cantidad": 105},
		{"nombre": "Orégano", "descripcion": "Orégano seco deshidratado", "es_alergeno": False, "stock_cantidad": 107},
		{"nombre": "Ajo", "descripcion": "Ajo fresco picado", "es_alergeno": False, "stock_cantidad": 33},
		{"nombre": "Albahaca fresca", "descripcion": "Hojas de albahaca fresca", "es_alergeno": False, "stock_cantidad": 60},
		{"nombre": "Salame calabrés", "descripcion": "Salame picante tipo calabresa", "es_alergeno": False, "stock_cantidad": 54},
		{"nombre": "Queso azul", "descripcion": "Queso azul tipo roquefort", "es_alergeno": True, "stock_cantidad": 106},
		{"nombre": "Queso provolone", "descripcion": "Queso provolone estacionado", "es_alergeno": True, "stock_cantidad": 163},
		{"nombre": "Queso parmesano", "descripcion": "Queso parmesano rallado", "es_alergeno": True, "stock_cantidad": 105},
		{"nombre": "Rúcula", "descripcion": "Hojas de rúcula fresca", "es_alergeno": False, "stock_cantidad": 199},
		{"nombre": "Jamón crudo", "descripcion": "Jamón curado estacionado", "es_alergeno": False, "stock_cantidad": 82},
		{"nombre": "Champiñones", "descripcion": "Champiñones frescos fileteados", "es_alergeno": False, "stock_cantidad": 61},
		{"nombre": "Carne picada", "descripcion": "Carne vacuna picada", "es_alergeno": False, "stock_cantidad": 20},
		{"nombre": "Panceta", "descripcion": "Panceta ahumada en fetas", "es_alergeno": False, "stock_cantidad": 131},
		{"nombre": "Queso cheddar", "descripcion": "Queso cheddar en fetas", "es_alergeno": True, "stock_cantidad": 42}
	]

	with Session(engine) as session:
		for ing in ingredientes_data:
			existing = session.exec(select(Ingrediente).where(Ingrediente.nombre == ing["nombre"])).first()
			if not existing:
				session.add(
					Ingrediente(
						nombre=ing["nombre"],
						descripcion=ing["descripcion"],
						es_alergeno=ing["es_alergeno"],
						stock_cantidad=200,
					)
				)
		session.commit()

def seed_productos() -> None:
	create_db_and_tables()

	with Session(engine) as session:
		categorias_data = [
			{"nombre": "Pizzas", "descripcion": "Pizzas al horno de barro", "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591"},
			{"nombre": "Bebidas", "descripcion": "Gaseosas y cervezas bien frías", "imagen_url": "https://images.unsplash.com/photo-1497534446932-c925b458314e"},
			{"nombre": "Hamburguesas", "descripcion": "Hamburguesas caseras con papas fritas", "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd"},
			{"nombre": "Postres", "descripcion": "Cosas dulces para cerrar el día", "imagen_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b"},
			{"nombre": "Empanadas","descripcion": "Empanadas al horno y fritas", "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947"},
		]

		for cat in categorias_data:
			existing = session.exec(select(Categoria).where(Categoria.nombre == cat["nombre"])).first()
			if not existing:
				session.add(Categoria(nombre=cat["nombre"], descripcion=cat["descripcion"], imagen_url=cat["imagen_url"]))
		session.commit()

		# Mapear categorías y unidades de medida para fácil asignación
		categorias_map = {cat.nombre: cat for cat in session.exec(select(Categoria)).all()}
		ums_map = {um.simbolo: um.id for um in session.exec(select(UnidadMedida)).all()}

		productos_data = [
			{"nombre": "Pizza Muzzarella", "descripcion": "Salsa de tomate, muzzarella de primera calidad, aceitunas y orégano", "precio_base": 8500, "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Fugazzeta", "descripcion": "Masa de pizza cubierta con abundante cebolla y muzzarella", "precio_base": 9200, "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Especial", "descripcion": "Muzzarella, jamón cocido, morrones asados y aceitunas verdes", "precio_base": 9800, "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Napolitana", "descripcion": "Salsa, muzzarella, rodajas de tomate natural, ajo y albahaca fresca", "precio_base": 9400, "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Calabresa", "descripcion": "Salsa, muzzarella, rodajas de salame calabrés picante y aceitunas", "precio_base": 9900, "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Cuatro Quesos", "descripcion": "Muzzarella, queso azul, provolone y queso parmesano rallado", "precio_base": 10500, "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Rúcula y Crudo", "descripcion": "Muzzarella, hojas de rúcula fresca, jamón crudo y lluvia de parmesano", "precio_base": 11500, "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Champiñones", "descripcion": "Salsa, muzzarella, champiñones fileteados salteados al ajillo y perejil", "precio_base": 10200, "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Vegana", "descripcion": "Salsa de tomate, queso de almendras, vegetales asados de estación", "precio_base": 9600, "imagen_url": "https://images.unsplash.com/photo-1513104890138-7c749659a591", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Pizza Pollo Catupiry", "descripcion": "Salsa de tomate, muzzarella, pollo desmenuzado y queso catupiry", "precio_base": 10800, "imagen_url": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002", "categoria": "Pizzas", "um": "u"},
			{"nombre": "Hamburguesa Clásica", "descripcion": "Medallón de carne de 180g, queso cheddar y aderezo de la casa", "precio_base": 6500, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Completa", "descripcion": "Carne 180g, cheddar, lechuga, tomate, jamón, huevo frito y mayonesa", "precio_base": 7800, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Cheddar Bacon", "descripcion": "Medallón de carne 180g, triple cheddar, panceta crocante y barbacoa", "precio_base": 8200, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Doble Bacon", "descripcion": "Doble carne 180g, cuádruple cheddar, doble panceta y salsa stack", "precio_base": 9500, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Veggie Lentejas", "descripcion": "Medallón de lentejas y avena, queso, lechuga, tomate y palta", "precio_base": 6900, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Pollo Crispy", "descripcion": "Pechuga de pollo rebozada super crujiente, lechuga, cebolla morada", "precio_base": 7100, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Triple Cheddar", "descripcion": "Triple carne de 120g cada una, séxtuple cheddar y salsa de cebolla", "precio_base": 10500, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Blue Cheese", "descripcion": "Medallón de carne 180g, queso azul fundido, cebollas caramelizadas", "precio_base": 8400, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa BBQ Pork", "descripcion": "Carne de cerdo ahumada desmenuzada, salsa barbacoa y ensalada coleslaw", "precio_base": 8900, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Hamburguesa Huevo Frito", "descripcion": "Carne 180g, queso dambo, panceta, huevo frito y salsa criolla", "precio_base": 8000, "imagen_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd", "categoria": "Hamburguesas", "um": "u"},
			{"nombre": "Cerveza IPA 1L", "descripcion": "Cerveza artesanal IPA, amarga y aromática en botella de un litro", "precio_base": 3200, "imagen_url": "https://images.unsplash.com/photo-1567696911980-2eed69a46042", "categoria": "Bebidas", "um": "L"},
			{"nombre": "Cerveza Golden 1L", "descripcion": "Cerveza artesanal rubia, ligera y refrescante de un litro", "precio_base": 3000, "imagen_url": "https://images.unsplash.com/photo-1567696911980-2eed69a46042", "categoria": "Bebidas", "um": "L"},
			{"nombre": "Cerveza Honey 1L", "descripcion": "Cerveza artesanal con un toque dulce de miel natural de un litro", "precio_base": 3300, "imagen_url": "https://images.unsplash.com/photo-1567696911980-2eed69a46042", "categoria": "Bebidas", "um": "L"},
			{"nombre": "Cerveza Stout 1L", "descripcion": "Cerveza artesanal negra con notas de café y chocolate de un litro", "precio_base": 3400, "imagen_url": "https://images.unsplash.com/photo-1567696911980-2eed69a46042", "categoria": "Bebidas", "um": "L"},
			{"nombre": "Gaseosa Cola 500ml", "descripcion": "Refresco sabor cola de quinientos mililitros en envase descartable", "precio_base": 1500, "imagen_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97", "categoria": "Bebidas", "um": "mL"},
			{"nombre": "Gaseosa Lima 500ml", "descripcion": "Refresco sabor lima limón de quinientos mililitros descartable", "precio_base": 1500, "imagen_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97", "categoria": "Bebidas", "um": "mL"},
			{"nombre": "Gaseosa Pomelo 500ml", "descripcion": "Refresco sabor pomelo de quinientos mililitros descartable", "precio_base": 1500, "imagen_url": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97", "categoria": "Bebidas", "um": "mL"},
			{"nombre": "Agua Con Gas 500ml", "descripcion": "Agua mineralizada gasificada de quinientos mililitros", "precio_base": 1200, "imagen_url": "https://images.unsplash.com/photo-1608885898957-a599fb18ec3f", "categoria": "Bebidas", "um": "mL"},
			{"nombre": "Agua Sin Gas 500ml", "descripcion": "Agua mineral natural sin gas de quinientos mililitros", "precio_base": 1200, "imagen_url": "https://images.unsplash.com/photo-1608885898957-a599fb18ec3f", "categoria": "Bebidas", "um": "mL"},
			{"nombre": "Limonada Menta 1L", "descripcion": "Jugo de limón natural, menta fresca y jengibre en jarra de un litro", "precio_base": 2500, "imagen_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd", "categoria": "Bebidas", "um": "L"},
			{"nombre": "Volcán Chocolate", "descripcion": "Postre tibio con corazón fundido acompañado de helado de vainilla", "precio_base": 2800, "imagen_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c", "categoria": "Postres", "um": "u"},
			{"nombre": "Flan Casero", "descripcion": "Flan tradicional de vainilla horneado a baño maría con dulce de leche", "precio_base": 2200, "imagen_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b", "categoria": "Postres", "um": "u"},
			{"nombre": "Chocotorta", "descripcion": "Postre clásico argentino con galletitas de chocolate y crema de dulce de leche", "precio_base": 2600, "imagen_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b", "categoria": "Postres", "um": "u"},
			{"nombre": "Tiramisú", "descripcion": "Postre italiano con bizcochos humedecidos en café, mascarpone y cacao", "precio_base": 2900, "imagen_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9", "categoria": "Postres", "um": "u"},
			{"nombre": "Ensalada Frutas", "descripcion": "Ensalada fresca de frutas de estación cortadas al momento", "precio_base": 1800, "imagen_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b", "categoria": "Postres", "um": "u"},
			{"nombre": "Helado Americana 250g", "descripcion": "Cuarto de kilo de helado artesanal sabor crema americana", "precio_base": 2400, "imagen_url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb", "categoria": "Postres", "um": "kg"},
			{"nombre": "Helado Chocolate 250g", "descripcion": "Cuarto de kilo de helado artesanal sabor chocolate amargo", "precio_base": 2400, "imagen_url": "https://images.unsplash.com/photo-1563805042-7684c019e1cb", "categoria": "Postres", "um": "kg"},
			{"nombre": "Cheesecake Frutos Rojos", "descripcion": "Tarta de queso crema suave con cobertura y salsa de frutos rojos", "precio_base": 3100, "imagen_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b", "categoria": "Postres", "um": "u"},
			{"nombre": "Lemon Pie", "descripcion": "Tarta con base de masa quebrada, crema de limón y merengue italiano", "precio_base": 2700, "imagen_url": "https://images.unsplash.com/photo-1551024601-bec78aea704b", "categoria": "Postres", "um": "u"},
			{"nombre": "Brownie Helado", "descripcion": "Brownie tibio de chocolate y nueces con helado de crema americana", "precio_base": 2500, "imagen_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c", "categoria": "Postres", "um": "u"},
			{"nombre": "Empanada Carne Cuchillo", "descripcion": "Empanada clásica de carne vacuna cortada a cuchillo, cebolla y papa", "precio_base": 900, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Carne Suave", "descripcion": "Empanada al horno rellena de carne molida, condimentos suaves y huevo", "precio_base": 850, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Pollo Verdeo", "descripcion": "Pechuga de pollo desmenuzada salteada con cebolla de verdeo y crema", "precio_base": 850, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Jamon Queso", "descripcion": "Empanada rellena de jamón cocido picado y queso muzzarella fundido", "precio_base": 800, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Humita", "descripcion": "Relleno tradicional de choclo dulce desgranado, calabaza y salsa blanca", "precio_base": 850, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Verdura Salsa", "descripcion": "Espiñacas frescas salteadas unidas con queso y salsa blanca suave", "precio_base": 850, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Caprese", "descripcion": "Relleno de queso muzzarella, tomates secos picados y albahaca fresca", "precio_base": 850, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Queso Cebolla", "descripcion": "Combinación clásica de queso muzzarella, cebolla rehogada y condimentos", "precio_base": 800, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Roquefort", "descripcion": "Queso azul hilado, queso muzzarella, trocitos de nuez y apio", "precio_base": 900, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"},
			{"nombre": "Empanada Bondiola", "descripcion": "Carne de cerdo desmenuzada braseada a la cerveza negra y barbacoa", "precio_base": 950, "imagen_url": "https://images.unsplash.com/photo-1544025162-d76694265947", "categoria": "Empanadas", "um": "u"}
		]

		for prod in productos_data:
			existing = session.exec(select(Producto).where(Producto.nombre == prod["nombre"])).first()
			if not existing:
				cat_obj = categorias_map.get(prod["categoria"])
				um_id = ums_map.get(prod["um"])
				
				producto = Producto(
					nombre=prod["nombre"],
					descripcion=prod["descripcion"],
					precio_base=prod["precio_base"],
					imagen_url=[prod["imagen_url"]] if prod["imagen_url"] else [],
					unidad_venta_id=um_id
				)
				if cat_obj:
					producto.categorias = [cat_obj]
				session.add(producto)
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
		EstadoPedido(codigo="ENTREGADO", descripcion="Entregado", orden=5, es_terminal=True),
		EstadoPedido(codigo="CANCELADO", descripcion="Cancelado", orden=6, es_terminal=True),
	]

	with Session(engine) as session:
		existing = {estado.codigo for estado in session.exec(select(EstadoPedido)).all()}

		for estado in estados_pedido:
			if estado.codigo not in existing:
				session.add(estado)

		session.commit()

def seed_pedidos() -> None:
	create_db_and_tables()

	with Session(engine) as session:
		usuario = session.exec(select(Usuario).where(Usuario.username == "cliente")).first()
		if not usuario:
			print("  [!] No existe usuario cliente para pedidos")
			return

		productos = session.exec(select(Producto)).all()
		if len(productos) < 7:
			print("  [!] No hay suficientes productos para pedidos")
			return

		existing_pedidos = session.exec(select(Pedido)).all()
		if existing_pedidos:
			print("  [~] Limpiando pedidos existentes para re-seed...")
			
			session.exec(delete(HistorialEstadoPedido))
			session.exec(delete(DetallePedido))
			session.exec(delete(Pedido))
			session.commit()

		pedidos_data = [
			{
				"estado_codigo": "PENDIENTE",
				"forma_pago_codigo": "EFECTIVO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 1: Sin cebolla la fugazzeta",
				"detalles": [
					{"producto": productos[0], "cantidad": 2},
					{"producto": productos[1], "cantidad": 1},
					{"producto": productos[24], "cantidad": 2},
				],
				"pagado": True
			},
			{
				"estado_codigo": "CONFIRMADO",
				"forma_pago_codigo": "TRANSFERENCIA",
				"costo_envio": Decimal("0.00"),
				"notas": "Pedido 2: Retira cliente",
				"detalles": [
					{"producto": productos[11], "cantidad": 1},
					{"producto": productos[21], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "EN_PREP",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("600.00"),
				"notas": "Pedido 3: Enviar cubiertos",
				"detalles": [
					{"producto": productos[2], "cantidad": 1},
					{"producto": productos[32], "cantidad": 2},
				],
				"pagado": True
			},
			{
				"estado_codigo": "ENTREGADO",
				"forma_pago_codigo": "EFECTIVO",
				"costo_envio": Decimal("400.00"),
				"notas": "Pedido 4: Tocar timbre del portón gris",
				"detalles": [
					{"producto": productos[3], "cantidad": 1},
					{"producto": productos[27], "cantidad": 2},
				],
				"pagado": True
			},
			{
				"estado_codigo": "ENTREGADO",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 5: Todo excelente",
				"detalles": [
					{"producto": productos[4], "cantidad": 1},
					{"producto": productos[31], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "CANCELADO",
				"forma_pago_codigo": "EFECTIVO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 6: Cancelado por falta de repartidor",
				"detalles": [
					{"producto": productos[5], "cantidad": 1},
					{"producto": productos[20], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "PENDIENTE",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("700.00"),
				"notas": "Pedido 7: Tocar timbre 3B",
				"detalles": [
					{"producto": productos[6], "cantidad": 1},
					{"producto": productos[33], "cantidad": 1},
					{"producto": productos[28], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "CONFIRMADO",
				"forma_pago_codigo": "TRANSFERENCIA",
				"costo_envio": Decimal("400.00"),
				"notas": "Pedido 8: Dejar en portería",
				"detalles": [
					{"producto": productos[7], "cantidad": 1},
					{"producto": productos[25], "cantidad": 2},
				],
				"pagado": True
			},
			{
				"estado_codigo": "EN_PREP",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("0.00"),
				"notas": "Pedido 9: Take away",
				"detalles": [
					{"producto": productos[8], "cantidad": 1},
					{"producto": productos[29], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "ENTREGADO",
				"forma_pago_codigo": "EFECTIVO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 10: Llamar al celular al llegar",
				"detalles": [
					{"producto": productos[9], "cantidad": 1},
					{"producto": productos[30], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "ENTREGADO",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("400.00"),
				"notas": "Pedido 11: Entregado a tiempo",
				"detalles": [
					{"producto": productos[10], "cantidad": 2},
					{"producto": productos[24], "cantidad": 2},
				],
				"pagado": True
			},
			{
				"estado_codigo": "CANCELADO",
				"forma_pago_codigo": "TRANSFERENCIA",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 12: Cancelado por el cliente",
				"detalles": [
					{"producto": productos[12], "cantidad": 1},
					{"producto": productos[23], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "PENDIENTE",
				"forma_pago_codigo": "EFECTIVO",
				"costo_envio": Decimal("600.00"),
				"notas": "Pedido 13: Bacon bien crocante",
				"detalles": [
					{"producto": productos[13], "cantidad": 1},
					{"producto": productos[35], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "CONFIRMADO",
				"forma_pago_codigo": "TRANSFERENCIA",
				"costo_envio": Decimal("0.00"),
				"notas": "Pedido 14: Retira personal autorizado",
				"detalles": [
					{"producto": productos[14], "cantidad": 2},
					{"producto": productos[27], "cantidad": 2},
				],
				"pagado": True
			},
			{
				"estado_codigo": "EN_PREP",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 15: Sin aderezos",
				"detalles": [
					{"producto": productos[15], "cantidad": 1},
					{"producto": productos[37], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "ENTREGADO",
				"forma_pago_codigo": "EFECTIVO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 16: Enviar cambio de 10000",
				"detalles": [
					{"producto": productos[16], "cantidad": 1},
					{"producto": productos[22], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "ENTREGADO",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("400.00"),
				"notas": "Pedido 17: Sin observaciones",
				"detalles": [
					{"producto": productos[17], "cantidad": 1},
					{"producto": productos[26], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "PENDIENTE",
				"forma_pago_codigo": "EFECTIVO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 18: Empanadas calientes por favor",
				"detalles": [
					{"producto": productos[40], "cantidad": 6},
					{"producto": productos[44], "cantidad": 6},
					{"producto": productos[20], "cantidad": 1},
				],
				"pagado": True
			},
			{
				"estado_codigo": "CONFIRMADO",
				"forma_pago_codigo": "TRANSFERENCIA",
				"costo_envio": Decimal("450.00"),
				"notas": "Pedido 19: Nota del pedido",
				"detalles": [
					{"producto": productos[43], "cantidad": 12},
					{"producto": productos[31], "cantidad": 2},
				]
			},
			{
				"estado_codigo": "EN_PREP",
				"forma_pago_codigo": "MERCADOPAGO",
				"costo_envio": Decimal("500.00"),
				"notas": "Pedido 20: Postre frío",
				"detalles": [
					{"producto": productos[49], "cantidad": 6},
					{"producto": productos[38], "cantidad": 1},
					{"producto": productos[24], "cantidad": 1},
				]
			}
		]

		# Distribuir las fechas dentro del mes de junio (mes 6) para evitar pedidos en meses pasados
		dias_junio = [1, 2, 3, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 14, 14, 15, 15, 15]
		now = datetime.datetime.now(datetime.timezone.utc)
		anio_actual = now.year
		for idx, data in enumerate(pedidos_data):
			subtotal = sum([d["producto"].precio_base * d["cantidad"] for d in data["detalles"]])
			total = subtotal + data["costo_envio"]

			dia = dias_junio[idx] if idx < len(dias_junio) else 15
			created_date = datetime.datetime(
				year=anio_actual,
				month=6,
				day=dia,
				hour=(12 + (idx % 8)) % 24,
				minute=(10 * idx) % 60,
				tzinfo=datetime.timezone.utc
			)

			pedido = Pedido(
				usuario_id=usuario.id,
				estado_codigo=data["estado_codigo"],
				forma_pago_codigo=data["forma_pago_codigo"],
				pagado=data.get("pagado", False),
				subtotal=subtotal,
				costo_envio=data["costo_envio"],
				total=total,
				notas=data.get("notas", ""),
				created_at=created_date,
				updated_at=created_date,
			)
			session.add(pedido)
			session.flush()

			for d in data["detalles"]:
				prod = d["producto"]
				detalle = DetallePedido(
					pedido_id=pedido.id,
					producto_id=prod.id,
					cantidad=d["cantidad"],
					nombre_snapshot=prod.nombre,
					precio_snapshot=prod.precio_base,
					subtotal_snap=prod.precio_base * d["cantidad"],
				)
				session.add(detalle)

			historial = HistorialEstadoPedido(
				pedido_id=pedido.id,
				estado_hacia=data["estado_codigo"],
				motivo="Creación inicial en seed",
				created_at=created_date,
			)
			session.add(historial)

		session.commit()
		print(f"  [+] Creados {len(pedidos_data)} pedidos iniciales")

def seed_pedido_catalogos() -> None:
	seed_formas_pago()
	seed_estados_pedido()


if __name__ == "__main__":
	seed_roles()
	seed_pedido_catalogos()
	seed_pedidos()

