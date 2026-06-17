import logging
from typing import Any
from fastapi import WebSocket

logger = logging.getLogger("app.core.websocket")


class ConnectionManager:
    # Gestor de conexiones WebSocket

    def __init__(self) -> None:
        self.socket_rooms: dict[WebSocket, set[str]] = {}
        self.rooms: dict[str, set[WebSocket]] = {}

    async def connect(
        self, websocket: WebSocket, *, role: str = "", user_id: int = 0
    ) -> None:
        # Acepta el handshake y registra la conexión
        await websocket.accept()

        if role:
            role_key = f"role:{role.lower()}"
            # Unir el socket a su room de rol
            self._join_room(websocket, role_key)

        logger.info(
            f"Conexión WebSocket aceptada. user_id={user_id}, role={role}, "
            f"Total rooms activas: {len(self.rooms)}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        # Elimina la conexión del registro. discard no lanza error si no existe.
        rooms = self.socket_rooms.pop(websocket, set())

        # Remover de cada room
        for room in rooms:
            if room in self.rooms:
                self.rooms[room].discard(websocket)
                # Si la room quedó vacía, eliminarla para no acumular rooms huérfanas
                if not self.rooms[room]:
                    del self.rooms[room]

        logger.info(
            f"Conexión WebSocket finalizada. Rooms liberadas: {rooms}. "
            f"Total rooms activas: {len(self.rooms)}"
        )

    async def broadcast_to_role(
        self, role: str, event_type: str, data: dict[str, Any]
    ) -> None:
        """
        Envía un evento a TODOS los sockets en la room de un rol específico.

        Ejemplo:
          broadcast_to_role("cocina", "PEDIDO_CONFIRMADO", pedido_data)
          → todos los cocineros conectados reciben el evento

        Args:
            role:      Nombre del rol (se normaliza a minúsculas)
            event_type: Tipo de evento (ej: "PEDIDO_CONFIRMADO")
            data:      Datos del pedido (diccionario serializable a JSON)
        """
        room = f"role:{role.lower()}"
        await self._emit_to_room(room, event_type, data)

    async def broadcast_to_order(
        self, order_id: int, event_type: str, data: dict[str, Any]
    ) -> None:
        """
        Envía un evento a todos los sockets suscritos a un pedido específico.

        Ejemplo:
          broadcast_to_order(5, "PEDIDO_EN_PREPARACION", pedido_data)
          → el cliente que hizo el pedido #5 recibe la actualización

        Args:
            order_id:  ID del pedido
            event_type: Tipo de evento
            data:      Datos del pedido
        """
        room = f"order:{order_id}"
        await self._emit_to_room(room, event_type, data)

    async def broadcast_to_roles(
        self, roles: list[str], event_type: str, data: dict[str, Any]
    ) -> None:
        """
        Envía un evento a múltiples rooms de rol SIN duplicar envíos.

        Si un socket está en varias rooms (ej: admin en role:admin Y role:pedidos),
        solo recibe el evento una vez. Esto evita que un admin vea duplicados.

        Ejemplo:
          broadcast_to_roles(["pedidos", "cocina"], "PEDIDO_CONFIRMADO", data)
          → cajeros y cocineros reciben el evento, pero nadie lo recibe dos veces

        Args:
            roles:      Lista de nombres de rol (ej: ["pedidos", "cocina"])
            event_type: Tipo de evento
            data:      Datos del pedido
        """
        sent_to: set[WebSocket] = set()
        payload = {"event": event_type, "data": data}

        for role in roles:
            room = f"role:{role.lower()}"
            if room not in self.rooms:
                continue
            for connection in list(self.rooms[room]):
                if connection not in sent_to:
                    try:
                        await connection.send_json(payload)
                        sent_to.add(connection)
                    except Exception as e:
                        # Conexión caída — la removemos y seguimos con las demás
                        logger.warning(
                            f"Error al enviar WebSocket. Removiendo conexión: {e}"
                        )
                        self.disconnect(connection)

    async def broadcast(self, event_type: str, data: dict[str, Any]) -> None:
        """
        Broadcast a TODAS las conexiones activas (método de fallback).

        Este método existe por compatibilidad y para casos donde se necesita
        notificar a todos sin importar el rol. En el uso normal del sistema,
        se prefieren broadcast_to_role() y broadcast_to_order().

        Evita duplicados: si un socket está en múltiples rooms, solo recibe
        el evento una vez.
        """
        sent_to: set[WebSocket] = set()
        payload = {"event": event_type, "data": data}

        for room_connections in self.rooms.values():
            for connection in list(room_connections):
                if connection not in sent_to:
                    try:
                        await connection.send_json(payload)
                        sent_to.add(connection)
                    except Exception as e:
                        logger.warning(
                            f"Error al enviar WebSocket. Removiendo conexión: {e}"
                        )
                        self.disconnect(connection)

    # =========================================================================
    # UTILIDADES DE DEBUG
    # =========================================================================

    def get_active_connections_count(self) -> int:
        """
        Retorna el total de conexiones únicas activas.

        Útil para monitoreo y health checks.
        """
        return len(self.socket_rooms)

    def get_rooms_info(self) -> dict[str, int]:
        """
        Retorna información de debug: cada room y cuántos sockets tiene.

        Ejemplo de retorno:
          {
            "role:cocina": 2,
            "role:pedidos": 1,
            "order:5": 1,
          }

        Útil para endpoints de debug o monitoreo.
        """
        return {room: len(sockets) for room, sockets in self.rooms.items()}

    # =========================================================================
    # MÉTODOS PRIVADOS
    # =========================================================================

    def _join_room(self, websocket: WebSocket, room: str) -> None:
        """
        Método interno para agregar un socket a una room.

        Actualiza AMBOS mapos de datos:
          1. self.rooms[room].add(websocket)         — la room sabe que el socket está ahí
          2. self.socket_rooms[websocket].add(room)   — el socket sabe en qué rooms está

        Esta duplicación de estado es intencional: permite consultas eficientes
        en ambas direcciones (¿quién está en esta room? / ¿en qué rooms está este socket?).

        Args:
            websocket: La conexión a agregar
            room:      Nombre de la room (ej: "role:cocina", "order:5")
        """
        # Agregar socket a la room
        if room not in self.rooms:
            self.rooms[room] = set()
        self.rooms[room].add(websocket)

        # Agregar room al socket (mapa inverso)
        if websocket not in self.socket_rooms:
            self.socket_rooms[websocket] = set()
        self.socket_rooms[websocket].add(room)

    async def _emit_to_room(
        self, room: str, event_type: str, data: dict[str, Any]
    ) -> None:
        """
        Método interno para enviar un evento a todos los sockets de una room.

        Si la room no existe o está vacía, el evento se descarta silenciosamente
        (no es un error — simplemente no hay nadie escuchando).

        Si un socket falla al recibir el evento (conexión caída), se remueve
        de todas las rooms y se continúa con los demás.

        Args:
            room:       Nombre de la room destino
            event_type: Tipo de evento (ej: "PEDIDO_CONFIRMADO")
            data:      Datos a enviar (se serializa a JSON automáticamente)
        """
        if room not in self.rooms:
            logger.info(f"Evento {event_type} descartado (room {room} vacía).")
            return

        payload = {"event": event_type, "data": data}
        logger.info(
            f"Emit {event_type} a room {room} ({len(self.rooms[room])} sockets)."
        )

        for connection in list(self.rooms[room]):
            try:
                await connection.send_json(payload)
            except Exception as e:
                # Conexión caída — la removemos y seguimos con las demás
                logger.warning(f"Error al enviar WebSocket. Removiendo conexión: {e}")
                self.disconnect(connection)


# =============================================================================
# INSTANCIA GLOBAL (SINGLETON)
# =============================================================================
# El ConnectionManager es un singleton — una sola instancia para toda la app.
#
# Se importa desde:
#   - router.py:   para connect() y disconnect() en el handshake/desconexión
#   - service.py:  para broadcast_to_order() y broadcast_to_roles() al cambiar estado
#
# Uso:
#   from app.core.websocket import manager
#   await manager.broadcast_to_role("cocina", "PEDIDO_CONFIRMADO", pedido_data)
#
manager = ConnectionManager()
