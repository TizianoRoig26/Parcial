import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cambioEstado,
  getDetalle,
  getDireccion,
  getPedidos,
  getPedidoById
} from "../services/pedidos.services";
import { useCallback, useState } from "react";
import { getUsernameById } from "../../auth/services/auth.services";
import { useAuthStore } from "../../../store/authStore";
import { useWebSocket, type WsMessage } from "./useWebSocket";
import type { IPedido } from "../IPedido";

export const UsuarioNombre = ({ id }: { id: number }) => {
  const { data: username, isLoading } = useQuery({
    queryKey: ["usuario-nombre", id],
    queryFn: () => getUsernameById(id),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return null;
  return username || null;
};


export const PedidoDetalles = ({ pedidoId }: { pedidoId: number }) => {
  const { data: detalles, isLoading } = useQuery({
    queryKey: ["pedido-detalles", pedidoId],
    queryFn: () => getDetalle(pedidoId),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return null;
  if (!detalles || detalles.length === 0) return 'Sin productos';

  const itemsText = detalles.map((d: any) => `${d.nombre_snapshot} x${d.cantidad}`).join(", ");
  return itemsText;
};


export const PedidoDireccion = ({ id }: { id: number | null | undefined }) => {
  const { data: direccion, isLoading } = useQuery({
    queryKey: ["direccion", id],
    queryFn: () => getDireccion(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  if (!id) return "Retiro en local";
  if (isLoading) return "Cargando dirección...";
  if (!direccion) return "Sin dirección asignada";

  const { alias, linea1, ciudad } = direccion;
  return `${alias ? `${alias}: ` : ""}${linea1}, ${ciudad}`;
};

export const usePedidos = () => {
  const queryClient = useQueryClient();
  const [vista, setVista] = useState<string>("principal");

  const { data: pedidos, isLoading, isError } = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => getPedidos(),
    staleTime: 1000 * 60 * 2,
  });

  const handleObtenerTiempo = (fecha: string) => {
    const horaPedido = new Date(fecha)
    const fechaActual = new Date();
    const diferencia = fechaActual.getTime() - horaPedido.getTime();
    const minutos = Math.floor(diferencia / 60000);
    return minutos;
  }

  const handleCambiarVista = () => {
    if(vista === "secundaria"){
      setVista("principal")
    }
    else{
      setVista("secundaria")
    }
  }

  const handleCambiaEstado = async (id: number, cancelado?: boolean ) => {
    const estadoActual = pedidos?.data.find(pedido => pedido.id === id)?.estado_codigo;
    let nuevoEstado = "";

    if (cancelado) {
      nuevoEstado = "CANCELADO";
    } else if (estadoActual === "PENDIENTE") {
      nuevoEstado = "CONFIRMADO";
    } else if (estadoActual === "CONFIRMADO") {
      nuevoEstado = "EN_PREP";
    } else if (estadoActual === "EN_PREP") {
      nuevoEstado = "ENTREGADO";
    }

    if (nuevoEstado) {
      try {
        await cambioEstado(id, nuevoEstado);
        queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      } catch (error) {
        console.error("Error al cambiar estado:", error);
      }
    }
  }
  const { hasRole } = useAuthStore();
  const isPedidos = hasRole("pedidos") || hasRole("admin");
  useWebSocket({
    enabled: isPedidos,
    onMessage: useCallback(
      (msg: WsMessage) => {
        console.log("[CAJERO WS]", msg.event, msg.data);
        if (msg.event === "WS_CONNECTED") {
          queryClient.invalidateQueries({ queryKey: ["pedidos", "cajero"] });
          return;
        }
        if (msg.event === "NUEVO_PEDIDO") {
          const nuevo = msg.data as IPedido;
          queryClient.setQueryData<{ data: IPedido[]; total: number }>(
            ["pedidos"],
            (prev) => {
              if (!prev) return { data: [nuevo], total: 1 };
              if (prev.data.some((p) => p.id === nuevo.id)) return prev;
              const newItems = [...prev.data, nuevo].sort((a, b) => {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              });
              return {
                data: newItems,
                total: prev.total + 1,
              };
            },
          );
        } else {
          const updated = msg.data as IPedido;
          if (updated?.id) {
            queryClient.setQueryData<{ data: IPedido[]; total: number }>(
              ["pedidos"],
              (prev) => {
                if (!prev) return { data: [], total: 0 };
                return {
                  data: prev.data.map((p) => (p.id === updated.id ? updated : p)),
                  total: prev.total,
                };
              },
            );
          }
        }
      },
      [queryClient],
    ),
  });

  return {
    pedidos,
    isLoading,
    isError,
    handleObtenerTiempo,
    handleCambiaEstado,
    handleCambiarVista,
    vista
  };
}

export const usePedidoDetail = (pedidoId: number) => {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((state) => state.hasRole);
  const isAdmin = hasRole("admin");
  const isPedidos = hasRole("pedidos");

  const { data: pedido, isLoading: isPedidoLoading, isError: isPedidoError } = useQuery({
    queryKey: ["pedido", pedidoId],
    queryFn: () => getPedidoById(pedidoId),
    enabled: !isNaN(pedidoId),
    staleTime: 1000 * 60 * 2,
  });

  const { data: detalles, isLoading: isDetallesLoading } = useQuery({
    queryKey: ["pedido-detalles", pedidoId],
    queryFn: () => getDetalle(pedidoId),
    enabled: !isNaN(pedidoId),
    staleTime: 1000 * 60 * 5,
  });

  const handleAvanzarEstado = async (nuevoEstado: string, motivo?: string) => {
    try {
      await cambioEstado(pedidoId, nuevoEstado, motivo);
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedido", pedidoId] });
    } catch (error) {
      console.error("Error al actualizar el estado del pedido:", error);
    }
  };

  return {
    pedido,
    isPedidoLoading,
    isPedidoError,
    detalles,
    isDetallesLoading,
    handleAvanzarEstado,
    isAdmin,
    isPedidos
  };
};

