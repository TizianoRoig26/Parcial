import { useQuery } from "@tanstack/react-query";
import { getProductos } from "../../productos/services/producto.services";
import { getIngredientes } from "../../ingredientes/services/ingrediente.services";
import { getCategorias } from "../../categoria";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getEstadisticas } from "../../pedidos/services/pedidos.services";
import { useEstadisticas } from "../hooks/estadisticasHooks";


export const EstadisticasPages = () => {
  const {
    kpis,
    ventasPeriodo,
    ingresosFormaPago,
    pedidosPorEstado,
    productosMasVendidos,
    setDesde,
    setHasta,
    setAgrupacion,
    errorMessage,
    setErrorMessage,
    isLoading,
    isError
  } = useEstadisticas();

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl p-6">
      <div className="mb-8">
        <div className="pb-4 border-b border-[#0D4012]/10">
          <h1 className="text-4xl font-extrabold text-[#0D4012] tracking-tight">Panel de Estadísticas</h1>
          <p className="text-gray-600 mt-1">Visualiza el rendimiento de BigPickle en tiempo real.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          <div className="h-32 bg-white/50 border border-[#0D4012]/10 rounded-3xl">Cargando...</div>
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl">
          Error al cargar las estadísticas. Por favor, intente de nuevo.
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* Fila de 3 Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Card 1: Total Ventas */}
            <div className="bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="p-3 bg-[#47AA66]/20 text-[#0D4012] rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
                    <circle cx="12" cy="12" r="2" strokeWidth={2} />
                    <path d="M6 12h.01M18 12h.01" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-600">Total Pedidos del Mes</p>
                <h3 className="text-3xl font-black text-black mt-1">{kpis?.cantidad_pedidos_mes}</h3>
              </div>
            </div>

            {/* Card 2: Pedidos Hoy */}
            <div className="bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="p-3 bg-[#E6D8A3] text-[#7C662B] rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-600">Total Ventas de Hoy</p>
                <h3 className="text-3xl font-black text-black mt-1">{kpis?.ventas_hoy}</h3>
              </div>
            </div>

            {/* Card 3: Categorias */}
            <div className="bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="p-3 bg-[#47AA66]/20 text-[#0D4012] rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-600">Ticket Promedio</p>
                <h3 className="text-3xl font-black text-black mt-1">${kpis?.ticket_promedio}</h3>
              </div>
            </div>

            {/* Card 4: Ticket Promedio */}
            <div className="bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="p-3 bg-[#47AA66]/20 text-[#0D4012] rounded-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-semibold text-gray-600">Pedidos Activos</p>
                <h3 className="text-3xl font-black text-black mt-1">{kpis?.pedidos_activos}</h3>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};