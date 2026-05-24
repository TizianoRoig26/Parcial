import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cambioEstado,
  getDetalle,
  getPedidos
} from "../services/pedidos.services";
import { useState } from "react";
import { getUserById } from "../../auth/services/auth.services";

export const UsuarioNombre = ({ id }: { id: number }) => {
  const { data: usuario, isLoading } = useQuery({
    queryKey: ["usuario", id],
    queryFn: () => getUserById(id),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return null;
  return usuario?.full_name || null;
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

export const usePedidos = () => {

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

  const handleCambiaEstado = (id: number, estado: string) => {
    cambioEstado(id, estado);
  }

  return {
    pedidos,
    isLoading,
    isError,
    handleObtenerTiempo,
    handleCambiaEstado
  };
}

