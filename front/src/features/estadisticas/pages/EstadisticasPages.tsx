import { useQuery } from "@tanstack/react-query";
import { getProductos } from "../../productos/services/producto.services";
import { getIngredientes } from "../../ingredientes/services/ingrediente.services";
import { getCategorias } from "../../categoria";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getEstadisticas } from "../../pedidos/services/pedidos.services";


export const EstadisticasPages = () => {
  const {
    data: productosData,
    isLoading: isLoadingProductos,
    isError: isErrorProductos,
  } = useQuery({
    queryKey: ["productos", "stats"],
    queryFn: () => getProductos(0, 1),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: metricasData,
    isLoading: isLoadingMetricas,
    isError: isErrorMetricas,
  } = useQuery({
    queryKey: ["metricas"],
    queryFn: () => getEstadisticas(),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: ingredientesData,
    isLoading: isLoadingIngredientes,
    isError: isErrorIngredientes,
  } = useQuery({
    queryKey: ["ingredientes", "stats"],
    queryFn: () => getIngredientes(0, 1),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: categoriasData,
    isLoading: isLoadingCategorias,
    isError: isErrorCategorias,
  } = useQuery({
    queryKey: ["categorias", "stats"],
    queryFn: () => getCategorias(),
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isLoadingProductos || isLoadingIngredientes || isLoadingCategorias || isLoadingMetricas;
  const isError = isErrorProductos || isErrorIngredientes || isErrorCategorias || isErrorMetricas;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl p-6">
      <div className="mb-8">
        <div className="pb-4 border-b border-[#0D4012]/10">
          <h1 className="text-4xl font-extrabold text-[#0D4012] tracking-tight">Panel de Estadísticas</h1>
          <p className="text-gray-600 mt-1">Visualiza el rendimiento de BigPickle en tiempo real.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          <div className="h-32 bg-white/50 border border-[#0D4012]/10 rounded-3xl"></div>
          <div className="h-32 bg-white/50 border border-[#0D4012]/10 rounded-3xl"></div>
          <div className="h-32 bg-white/50 border border-[#0D4012]/10 rounded-3xl"></div>
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
                <p className="text-sm font-semibold text-gray-600">Total Productos</p>
                <h3 className="text-3xl font-black text-black mt-1">{productosData?.total ?? 0}</h3>
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
                <p className="text-sm font-semibold text-gray-600">Total Ingredientes</p>
                <h3 className="text-3xl font-black text-black mt-1">{ingredientesData?.total ?? 0}</h3>
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
                <p className="text-sm font-semibold text-gray-600">Total de Categorías</p>
                <h3 className="text-3xl font-black text-black mt-1">{categoriasData?.total ?? 0}</h3>
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
                <p className="text-sm font-semibold text-gray-600">Ticket Promedio</p>
                <h3 className="text-3xl font-black text-black mt-1">
                  ${metricasData && metricasData.length > 0 ? metricasData[0].ticket_promedio_anual_global : 0}
                </h3>
              </div>
            </div>
          </div>

          {/* Gráfico de barras real */}
          <div className="mt-8 bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0D4012] mb-4">Pedidos Mensuales (Último Año)</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricasData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0D4012" strokeOpacity={0.1} />
                  <XAxis dataKey="mes_anio" stroke="#0D4012" tickLine={false} />
                  <YAxis stroke="#0D4012" tickLine={false} />
                  <Tooltip cursor={{ fill: '#47AA66', opacity: 0.05 }} />
                  <Legend />
                  <Bar dataKey="cantidad_pedidos" fill="#47AA66" name="Cantidad de Pedidos" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sección de Datos Reales del Inventario */}
          <div className="mt-8 pt-4 border-t border-[#0D4012]/10 flex justify-between text-xs text-gray-600">
            <span>Total Productos en Catálogo: <strong className="text-black">{productosData?.total ?? 0}</strong></span>
            <span>Total Ingredientes Registrados: <strong className="text-black">{ingredientesData?.total ?? 0}</strong></span>
            {metricasData && metricasData.length > 0 && (
              <span>
                Producto estrella: <strong className="text-black">{metricasData[0].producto_top_nombre}</strong> ({metricasData[0].producto_top_unidades} u.)
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};