from typing import Annotated

from fastapi.responses import HTMLResponse
import json
import pathlib
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status, HTTPException
from sqlmodel import Session

from app.core.websocket import manager
from app.core.deps import get_current_active_user, require_role
from app.core.database import engine, get_session
from app.core.security import decode_access_token
from app.modules.pedido.schemas import DetallePedidoPublic, PedidoCreate, PedidoEstadoUpdate, PedidoList, PedidoPublic
from app.modules.pedido.service import PedidoService
from app.modules.pedido.unit_of_work import PedidosUnitOfWork, get_uow
from app.modules.usuario.unit_of_work import UsuariosUnitOfWork
from app.modules.usuario.model import Usuario
from app.modules.usuario.schemas import UserPublic

# =============================================================================
# CONFIGURACIÓN DEL ROUTER
# =============================================================================

router = APIRouter()

# Roles autorizados para acceder a los endpoints de cocina/KDS
# Se incluyen variaciones en mayúsculas para robustez en comparación
COCINA_ROLES = ["cocina", "COCINA", "pedidos", "PEDIDOS", "admin", "ADMIN"]

# Roles que pueden gestionar pedidos (para WebSocket y FSM)
# Lista normalizada en minúsculas para lógica interna
STAFF_ROLES = ["admin", "pedidos", "cocina"]


def get_pedido_service(session: Session = Depends(get_session)) -> PedidoService:
    """Factory: inyecta la sesión de BD en el service (dependency injection)."""
    uow = PedidosUnitOfWork(session)
    return PedidoService(uow)


@router.post(
	"/",
	response_model=PedidoPublic,
	status_code=status.HTTP_201_CREATED,
	summary="Crear pedido",
)
async def create_pedido(
	data: PedidoCreate,
	current_user: Annotated[Usuario, Depends(get_current_active_user)],
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	return await svc.create(data, usuario_id=current_user.id)


@router.get(
	"/",
	response_model=PedidoList,
	summary="Listar pedidos para el panel de administracion",
	dependencies=[Depends(require_role(["ADMIN", "PEDIDOS"]))],
)
def list_pedidos(
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoList:
	return svc.get_all()


@router.get(
	"/mis-pedidos",
	response_model=PedidoList,
	summary="Listar mis pedidos (usuario autenticado)",
)
def get_mis_pedidos(
	current_user: Annotated[Usuario, Depends(get_current_active_user)],
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoList:
	return svc.get_mis_pedidos(usuario_id=current_user.id)


@router.get(
	"/{id}",
	response_model=PedidoPublic,
	summary="Obtener pedido por ID",
	dependencies=[Depends(require_role(["ADMIN", "PEDIDOS"]))],
)
def get_pedido(
	id: int,
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	return svc.get_by_id(id)


@router.patch(
	"/{id}/estado",
	response_model=PedidoPublic,
	summary="Avanzar estado del pedido",
)
async def avanzar_estado_pedido(
	id: int,
	data: PedidoEstadoUpdate,
	current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	return await PedidoPublic.model_validate(
		svc.avanzar_estado(
			pedido_id=id,
			data=data,
			usuario_id=current_user.id,
			roles_usuario=current_user.role_codes,
		)
	)


@router.post(
	"/{id}/cancel",
	response_model=PedidoPublic,
	summary="Cancelar pedido (usuario)",
)
async def cancelar_pedido_usuario(
 	id: int,
 	data: PedidoEstadoUpdate,
 	current_user: Annotated[Usuario, Depends(get_current_active_user)],
 	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	if data.estado_hacia != "CANCELADO":
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El estado objetivo debe ser 'CANCELADO'")
	return await PedidoPublic.model_validate(
		svc.cancelar_por_usuario(pedido_id=id, motivo=data.motivo, usuario_id=current_user.id)
	)


@router.post(
	"/{id}/cancel-admin",
	response_model=PedidoPublic,
	summary="Cancelar pedido (admin)",
	dependencies=[Depends(require_role(["ADMIN", "PEDIDOS"]))],
)
async def cancelar_pedido_admin(
 	id: int,
 	data: PedidoEstadoUpdate,
 	current_user: Annotated[Usuario, Depends(require_role(["ADMIN", "PEDIDOS"]))],
 	svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
	if data.estado_hacia != "CANCELADO":
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El estado objetivo debe ser 'CANCELADO'")
	return await PedidoPublic.model_validate(
		svc.cancelar_por_admin(pedido_id=id, motivo=data.motivo, usuario_id=current_user.id)
	)


@router.get(
	"/{id}/detalles",
	response_model=list[DetallePedidoPublic],
	summary="Obtener detalles (items) de un pedido",
)
def get_pedido_detalles(
	id: int,
	svc: PedidoService = Depends(get_pedido_service),
) -> list[DetallePedidoPublic]:
	return svc.get_detalles_por_pedido(id)


# =============================================================================
# ENDPOINTS DEL DISPLAY DE COCINA (KDS)
# =============================================================================

@router.get("/cocina", response_class=HTMLResponse, tags=["kds"])
def get_cocina_dashboard():
    """
    GET /api/v1/cocina — Sirve la interfaz visual del KDS como HTML.

    Lee el archivo kds.html desde el directorio de templates.
    No requiere autenticación (el login está en el propio HTML).
    """
    html_path = pathlib.Path(__file__).parent.parent.parent / "templates" / "kds.html"
    if not html_path.exists():
        return HTMLResponse("<h2>KDS template not found</h2>", status_code=404)
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@router.get("/cocina/pedidos", response_model=list[PedidoPublic])
def list_cocina_pedidos(
    _user: Annotated[UserPublic, Depends(require_role(COCINA_ROLES))],
    svc: PedidoService = Depends(get_pedido_service),
) -> list[PedidoPublic]:
    """
    GET /api/v1/cocina/pedidos — Lista pedidos activos para la pantalla de cocina.

    Requiere: roles cocina, pedidos o admin.
    Filtra solo estados activos de cocina: "confirmado" o "preparando".
    Ordenados por antigüedad (ID ascendente).
    """
    return svc.list_cocina_pedidos()


# =============================================================================
# ENDPOINTS DE SERVICIO PARA FRONTENDS
# =============================================================================

CAJERO_ROLES = ["admin", "pedidos"]


@router.get("/cajero", response_class=HTMLResponse, tags=["cajero"])
def get_cajero_dashboard():
    """GET /api/v1/cajero — Sirve la pantalla del Cajero."""
    html_path = pathlib.Path(__file__).parent.parent.parent / "templates" / "cajero.html"
    if not html_path.exists():
        return HTMLResponse("<h2>Cajero template not found</h2>", status_code=404)
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@router.get("/cliente", response_class=HTMLResponse, tags=["cliente"])
def get_cliente_dashboard():
    """GET /api/v1/cliente — Sirve la pantalla del Cliente."""
    html_path = pathlib.Path(__file__).parent.parent.parent / "templates" / "cliente.html"
    if not html_path.exists():
        return HTMLResponse("<h2>Cliente template not found</h2>", status_code=404)
    return HTMLResponse(html_path.read_text(encoding="utf-8"))


@router.get("/cajero/pedidos", response_model=list[PedidoPublic])
def list_cajero_pedidos(
    _user: Annotated[UserPublic, Depends(require_role(CAJERO_ROLES))],
    svc: PedidoService = Depends(get_pedido_service),
) -> list[PedidoPublic]:
    """GET /api/v1/cajero/pedidos — Lista todos los pedidos para el cajero."""
    return svc.list_all()


@router.get("/cliente/mis-pedidos", response_model=list[PedidoPublic])
def list_cliente_pedidos(
    current_user: Annotated[UserPublic, Depends(get_current_active_user)],
    svc: PedidoService = Depends(get_pedido_service),
) -> list[PedidoPublic]:
    """GET /api/v1/cliente/mis-pedidos — Lista pedidos del usuario autenticado."""
    from app.modules.pedido.unit_of_work import PedidoUnitOfWork
    with PedidoUnitOfWork(svc._session) as uow:
        pedidos = uow.pedidos.get_all()
        mis = [p for p in pedidos if p.usuario_id == current_user.id]
        mis.sort(key=lambda p: p.id or 0, reverse=True)
        return [PedidoPublic.model_validate(p) for p in mis]


# =============================================================================
# CAMBIO DE ESTADO (FSM — Finite State Machine)
# =============================================================================

@router.patch("/pedidos/{pedido_id}/estado", response_model=PedidoPublic)
async def avanzar_pedido_estado(
    pedido_id: int,
    data: PedidoEstadoUpdate,
    current_user: Annotated[UserPublic, Depends(require_role(COCINA_ROLES))],
    svc: PedidoService = Depends(get_pedido_service),
) -> PedidoPublic:
    """
    PATCH /api/v1/pedidos/{id}/estado — Avanza el estado de un pedido (FSM).

    Requiere: roles cocina, pedidos o admin.
    Valida la transición según la FSM + RBAC en un solo lookup.
    Emite eventos WebSocket a rooms relevantes después de persistir.

    Ejemplo de body:
        {"nuevo_estado": "confirmado", "motivo": "Pago verificado"}
    """
    return await svc.avanzar_estado(pedido_id, data.nuevo_estado, current_user)


# =============================================================================
# WEBSOCKET — CANAL BIDIRECCIONAL PARA TIEMPO REAL
# =============================================================================
#
# Este es el endpoint WebSocket principal del sistema.
#
# ─── PROTOCOLO ────────────────────────────────────────────────────────────────
#
# El protocolo sobre WebSocket es JSON bidireccional:
#
#   Cliente → Backend (acciones):
#     {"action": "subscribe-order",   "order_id": 5}
#     {"action": "unsubscribe-order", "order_id": 5}
#
#   Backend → Cliente (eventos):
#     {"event": "PEDIDO_CONFIRMADO",     "data": {...}}
#     {"event": "PEDIDO_EN_PREPARACION", "data": {...}}
#     {"event": "PEDIDO_EN_CAMINO",      "data": {...}}
#     {"event": "PEDIDO_CANCELADO",      "data": {...}}
#     {"event": "PEDIDO_ENTREGADO",      "data": {...}}
#     {"event": "SUBSCRIBED",            "data": {"order_id": 5}}
#     {"event": "ERROR",                 "data": {"detail": "..."}}
#
# ─── AUTENTICACIÓN ────────────────────────────────────────────────────────────
#
# El WebSocket NO soporta headers personalizados en el handshake desde el
# navegador (limitación del API WebSocket del browser). Por eso usamos
# cookies HttpOnly, que se envían automáticamente en el handshake:
#
#   1. El frontend primero hace login via REST: POST /api/v1/auth/token
#   2. El backend setea una cookie HttpOnly con el JWT
#   3. Al abrir el WebSocket, el browser envía la cookie automáticamente
#   4. El backend lee el JWT de la cookie y lo valida
#
# ─── SEGURIDAD ────────────────────────────────────────────────────────────────
#
#   - Solo usuarios activos pueden conectarse
#   - Los clientes (role:user) solo pueden suscribirse a pedidos propios
#   - La validación de propiedad se hace contra la BD (no confía en el cliente)
#   - Los códigos de cierre 1008 transmiten la razón del rechazo al frontend
#
# =============================================================================

@router.websocket("/cocina/ws")
async def websocket_endpoint(
    websocket: WebSocket,
):
    """
    WebSocket /api/v1/cocina/ws — Canal bidireccional autenticado para tiempo real.

    Flujo completo:
      1. Handshake: valida JWT desde cookie HttpOnly
      2. Conexión: une el socket a room de su rol
      3. Escucha: procesa suscripciones a pedidos específicos
      4. Desconexión: limpia todas las rooms del socket

    Arquitectura de rooms:
      - role:{rol}   → room del rol (cocina, pedidos, admin, user)
      - order:{id}   → room del pedido (solo para clientes)
    """

    # =========================================================================
    # PASO 1: EXTRAER TOKEN DE LA COOKIE HTTPONLY
    # =========================================================================
    # El browser envía automáticamente las cookies en el handshake WebSocket.
    # La cookie "access_token" contiene el JWT firmado.
    #
    # ¿Por qué cookie y no header?
    #   - El API WebSocket del navegador NO permite configurar headers
    #   - Las cookies HttpOnly no son accesibles desde JavaScript (protección XSS)
    #   - SameSite=lax previene ataques CSRF
    #
    token = websocket.cookies.get("access_token")

    if not token:
        # Sin token → rechazar con código 1008 (Policy Violation)
        # IMPORTANTE: debemos aceptar ANTES de close para que el cliente
        # reciba el código y la razón del rechazo
        await websocket.accept()
        await websocket.close(code=1008, reason="Token de autenticación requerido")
        return

    # =========================================================================
    # PASO 2: DECODIFICAR Y VALIDAR EL JWT
    # =========================================================================
    # decode_access_token() valida:
    #   - La firma HMAC (que no fue manipulado)
    #   - La expiración (exp claim)
    #   - Retorna el payload o None si es inválido
    #
    payload = decode_access_token(token)
    if not payload:
        await websocket.accept()
        await websocket.close(code=1008, reason="Token inválido o expirado")
        return

    # Extraer el "sub" (subject) del token — es el username
    username = payload.get("sub")
    if not username:
        await websocket.accept()
        await websocket.close(code=1008, reason="Token inválido")
        return

    # =========================================================================
    # PASO 3: VALIDAR USUARIO EN BASE DE DATOS
    # =========================================================================
    # Aunque el JWT sea válido, el usuario podría:
    #   - Haber sido eliminado de la BD
    #   - Haber sido desactivado (disabled=True)
    #
    # Siempre validamos contra la BD para tener la información más reciente.
    #
    # NOTA: Cualquier rol autenticado puede conectarse al WebSocket.
    # La diferenciación de roles se hace via rooms:
    #   - role:cocina  → recibe eventos de cocina
    #   - role:pedidos → recibe eventos de pedidos
    #   - role:user    → solo recibe eventos de sus pedidos específicos
    #
    with Session(engine) as db_session:
        with UsuarioUnitOfWork(db_session) as uow:
            user = uow.usuarios.get_by_username(username)
            if not user or user.disabled:
                await websocket.accept()
                await websocket.close(code=1008, reason="Usuario inválido o inactivo")
                return
            # Extraer valores primitivos DENTRO de la sesión antes de que se cierre.
            # Evita DetachedInstanceError al acceder a atributos fuera del bloque.
            user_role: str = user.role
            user_id: int = user.id

    # =========================================================================
    # PASO 4: REGISTRAR EN EL CONNECTION MANAGER
    # =========================================================================
    from app.core.websocket import manager
    await manager.connect(websocket, role=user_role, user_id=user_id)

    # Si el usuario es admin, también unirse a la room de admin
    # para recibir TODOS los eventos del sistema
    rol_upper = user_role.upper().strip()
    if rol_upper in ("ADMIN",):
        from app.core.websocket import manager as mgr
        mgr._join_room(websocket, "role:admin")

    # =========================================================================
    # PASO 5: BUCLE DE ESCUCHA DE MENSAJES
    # =========================================================================
    # El WebSocket queda en un bucle infinito procesando mensajes del cliente.
    #
    # Soporta dos acciones:
    #   - subscribe-order:   suscribirse a actualizaciones de un pedido
    #   - unsubscribe-order: desuscribirse de un pedido
    #
    # El bucle se rompe con WebSocketDisconnect (el cliente cerró la conexión)
    # o con cualquier otro error (se limpia la conexión).
    #
    try:
        while True:
            # Espera bloqueante: receive_text() se rompe cuando el cliente envía
            # un mensaje o cuando se desconecta (lanza WebSocketDisconnect)
            raw = await websocket.receive_text()

            # Parsear el mensaje JSON del cliente
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                # Mensaje malformado → ignorar y seguir escuchando
                continue

            action = msg.get("action")

            # ─── ACCIÓN: SUBSCRIBE-ORDER ──────────────────────────────────────
            # El cliente quiere suscribirse a las actualizaciones de un pedido.
            #
            # Para clientes (role:user):
            #   1. Valida que el pedido exista
            #   2. Valida que el pedido pertenezca al usuario
            #   3. Si es válido, une el socket a "order:{orderId}"
            #
            # Para staff (admin/pedidos/cocina):
            #   Se suscribe directamente (el staff puede ver cualquier pedido)
            #
            if action == "subscribe-order":
                order_id = msg.get("order_id")
                if not order_id or not isinstance(order_id, int):
                    continue

                # Validación de propiedad: solo para clientes (no staff)
                # Los staff pueden ver todos los pedidos
                if rol_upper not in ("ADMIN", "PEDIDOS", "COCINA"):
                    with Session(engine) as db_session:
                        with UsuarioUnitOfWork(db_session) as uow:
                            from app.modules.pedido.unit_of_work import PedidoUnitOfWork
                            pedido_uow = PedidoUnitOfWork(db_session)
                            pedido = pedido_uow.pedido.get_by_id(order_id)

                            # Validar que:
                            #   a. El pedido exista
                            #   b. El pedido pertenezca al usuario autenticado
                            if not pedido or pedido.usuario_id != user_id:
                                await websocket.send_json({
                                    "event": "ERROR",
                                    "data": {"detail": "No autorizado para este pedido"}
                                })
                                continue

                # Todo válido → unir el socket a la room del pedido
                manager.join_order_room(websocket, order_id)

                # Confirmar al cliente que se suscribió exitosamente
                await websocket.send_json({
                    "event": "SUBSCRIBED",
                    "data": {"order_id": order_id}
                })

            # ─── ACCIÓN: UNSUBSCRIBE-ORDER ────────────────────────────────────
            # El cliente deja de escuchar un pedido específico.
            #
            elif action == "unsubscribe-order":
                order_id = msg.get("order_id")
                if order_id and isinstance(order_id, int):
                    manager.leave_order_room(websocket, order_id)

    except WebSocketDisconnect:
        # El cliente cerró la conexión limpiamente
        manager.disconnect(websocket)
    except Exception:
        # Error inesperado → limpiar la conexión
        manager.disconnect(websocket)

