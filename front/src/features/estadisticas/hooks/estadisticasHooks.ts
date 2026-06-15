import { useState } from "react";
import { EstadisticasService } from "../services/estadisticas.services";
import { useQuery } from "@tanstack/react-query";


export const useEstadisticas = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [desde, setDesde] = useState("2026-01-01");
  const [hasta, setHasta] = useState("2026-12-31");
  const [agrupacion, setAgrupacion] = useState("day");

  const { data: kpis, isLoading: isLoadingKpis, isError: isErrorKpis } = useQuery({
    queryKey: ["kpis"],
    queryFn: () => EstadisticasService.getResumenKPIs(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: ventasPeriodo, isLoading: isLoadingVentas, isError: isErrorVentas } = useQuery({
    queryKey: ["ventasPeriodo", desde, hasta, agrupacion],
    queryFn: () => EstadisticasService.getVentasPeriodo(desde, hasta, agrupacion),
    staleTime: 1000 * 60 * 5,
  });

  const { data: ingresosFormaPago, isLoading: isLoadingIngresos, isError: isErrorIngresos } = useQuery({
    queryKey: ["ingresosFormaPago", desde, hasta],
    queryFn: () => EstadisticasService.getIngresosFormaPago(desde, hasta),
    staleTime: 1000 * 60 * 5,
  });

  const { data: pedidosPorEstado, isLoading: isLoadingEstados, isError: isErrorEstados } = useQuery({
    queryKey: ["pedidosPorEstado"],
    queryFn: () => EstadisticasService.getPedidosPorEstado(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: productosMasVendidos, isLoading: isLoadingProductos, isError: isErrorProductos } = useQuery({
    queryKey: ["productosMasVendidos"],
    queryFn: () => EstadisticasService.getProductosMasVendidos(),
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingKpis || isLoadingVentas || isLoadingIngresos || isLoadingEstados || isLoadingProductos;
  const isError = isErrorKpis || isErrorVentas || isErrorIngresos || isErrorEstados || isErrorProductos;

  return {
    kpis,
    ventasPeriodo,
    ingresosFormaPago,
    pedidosPorEstado,
    productosMasVendidos,
    isLoading,
    isError,
    setDesde,
    setHasta,
    setAgrupacion,
    errorMessage,
    setErrorMessage
  };
};
