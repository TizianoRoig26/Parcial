import { useEffect, type ReactNode, useCallback } from "react";
import { useAuthStore } from "../store/authStore";
import { useWebSocket, type WsMessage } from "../features/pedidos/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";

/**
 * InitApp: Componente que inicializa la autenticación
 * Se ejecuta una sola vez cuando la app carga
 */
export function InitApp({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Habilitar el WebSocket global únicamente si el usuario está autenticado
  // y pertenece al personal del negocio (ADMIN, PEDIDOS o COCINA).
  const logeado = isAuthenticated && user && ["ADMIN", "PEDIDOS", "COCINA"].includes(user.role.toUpperCase());

  useWebSocket({
    enabled: !!logeado,
    onMessage: useCallback(
      (msg: WsMessage) => {
        console.log("[GLOBAL WS]", msg.event, msg.data);
        
        // Al conectarse o reconectarse, forzar actualización de los listados de pedidos
        if (msg.event === "WS_CONNECTED") {
          queryClient.invalidateQueries({ queryKey: ["pedidos"] });
          return;
        }

        // Invalidar de manera proactiva la caché de React Query según el evento
        const eventName = msg.event;
        const pedidoId = (msg.data as any)?.id || (msg.data as any)?.pedido_id;

        // Se invalida el listado principal de pedidos para que todos los componentes
        // reflejen el cambio de estado en tiempo real.
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });

        // Si el evento afecta a un pedido específico, invalidamos su detalle en caché
        if (pedidoId) {
          queryClient.invalidateQueries({ queryKey: ["pedido", pedidoId] });
          queryClient.invalidateQueries({ queryKey: ["pedido-detalles", pedidoId] });
        }
      },
      [queryClient]
    ),
  });

  return <>{children}</>;
}
