import { useQuery } from "@tanstack/react-query";
import { getProductos } from "../../productos/services/producto.services";
import { getIngredientes } from "../../ingredientes/services/ingrediente.services";
import { getCategorias } from "../../categoria";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { getEstadisticas } from "../../pedidos/services/pedidos.services";
import { useEstadisticas } from "../hooks/estadisticasHooks";
const truncarTexto = (texto: string, max: number = 15): string => {
  return texto.length > max ? `${texto.substring(0, max)}...` : texto;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#F4F3CF] border border-[#0D4012] p-3 rounded-xl shadow-md text-xs text-black">
        <p className="font-bold text-[#0D4012]">{data.nombre}</p>
        <p className="text-gray-700 mt-1">
          Ingresos: <span className="font-bold text-black">${data.total_ventas}</span>
        </p>
        <p className="text-gray-700">
          Cantidad vendida: <span className="font-bold text-black">{data.cantidad_pedidos}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let fechaFormateada = data.periodo;
    try {
      fechaFormateada = new Date(data.periodo).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {}
    return (
      <div className="bg-[#F4F3CF] border border-[#0D4012] p-3 rounded-xl shadow-md text-xs text-black">
        <p className="font-bold text-[#0D4012]">{fechaFormateada}</p>
        <p className="text-gray-700 mt-1">
          Ingresos: <span className="font-bold text-black">${data.total_ventas}</span>
        </p>
        <p className="text-gray-700">
          Cantidad pedidos: <span className="font-bold text-black">{data.cantidad_pedidos}</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomPagoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#F4F3CF] border border-[#0D4012] p-3 rounded-xl shadow-md text-xs text-black">
        <p className="font-bold text-[#0D4012]">{data.nombre || data.id}</p>
        <p className="text-gray-700 mt-1">
          Total Ingresos: <span className="font-bold text-black">${data.total_ventas}</span>
        </p>
        <p className="text-gray-700">
          Cantidad pedidos: <span className="font-bold text-black">{data.cantidad_pedidos}</span>
        </p>
      </div>
    );
  }
  return null;
};

const COLORES_ESTADOS: { [key: string]: string } = {
  PENDIENTE: "#E6D8A3",
  CONFIRMADO: "#3B82F6",
  EN_PREP: "#8B5CF6",
  ENTREGADO: "#10B981",
  CANCELADO: "#EF4444",
};

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
                <h3 className="text-3xl font-black text-black mt-1">${kpis?.ventas_hoy ? Number(kpis.ventas_hoy).toFixed(2) : "0.00"}</h3>
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
                <h3 className="text-3xl font-black text-black mt-1">${kpis?.ticket_promedio ? Number(kpis.ticket_promedio).toFixed(2) : "0.00"}</h3>
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
        
          {/* Gráfico de barras real */}
          <div className="mt-8 bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0D4012] mb-4">Productos Más Vendidos</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productosMasVendidos?.map(p => ({ ...p, total_ventas: Number(p.total_ventas) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0D4012" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="nombre" 
                    stroke="#0D4012" 
                    tickLine={false} 
                    tickFormatter={(value) => truncarTexto(value, 7)} 
                  />
                  <YAxis 
                    dataKey="total_ventas" 
                    stroke="#0D4012" 
                    tickLine={false} 
                    tickFormatter={(value) => `$${value}`}
                    domain={[0, 'dataMax']}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#47AA66', opacity: 0.05 }} />
                  <Legend />
                  <Bar 
                    dataKey="total_ventas" 
                    fill="#47AA66" 
                    name="Ingresos" 
                    radius={[8, 8, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de líneas real */}
          <div className="mt-8 bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0D4012] mb-4">Ventas por Período</h3>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={ventasPeriodo?.map(p => ({
                    ...p,
                    total_ventas: Number(p.total_ventas),
                    cantidad_pedidos: Number(p.cantidad_pedidos)
                  }))}
                  margin={{
                    top: 5,
                    right: 10,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#0D4012" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="periodo" 
                    stroke="#0D4012" 
                    tickLine={false} 
                    tickFormatter={(value) => {
                      try {
                        const fecha = new Date(value);
                        return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#0D4012" 
                    tickLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#47AA66" 
                    tickLine={false} 
                  />
                  <Tooltip content={<CustomLineTooltip />} cursor={{ stroke: '#0D4012' }} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_ventas"
                    stroke="#0D4012"
                    name="Ingresos"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cantidad_pedidos"
                    stroke="#47AA66"
                    name="Cantidad Pedidos"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fila de Gráficos Secundarios (Distribución por Estado e Ingresos por Forma de Pago) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pb-8">
            {/* Gráfico de Torta: Distribución por Estado */}
            <div className="bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-[#0D4012] mb-4">Distribución por Estado</h3>
              <div className="w-full h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pedidosPorEstado}
                      dataKey="cantidad_pedidos"
                      nameKey="estado_codigo"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                    >
                      {pedidosPorEstado?.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORES_ESTADOS[entry.estado_codigo] || "#9CA3AF"} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Barras Horizontal: Ingresos por Forma de Pago */}
            <div className="bg-[#E5E4C1] border border-[#0D4012]/15 rounded-3xl p-6 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-[#0D4012] mb-4">Ingresos por Forma de Pago</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={ingresosFormaPago?.map(i => ({ ...i, total_ventas: Number(i.total_ventas) }))}
                    margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#0D4012" strokeOpacity={0.1} />
                    <XAxis type="number" stroke="#0D4012" tickLine={false} tickFormatter={(v) => `$${v}`} />
                    <YAxis dataKey="id" type="category" stroke="#0D4012" tickLine={false} tickFormatter={(value) => truncarTexto(value, 8)}  />
                    <Tooltip content={<CustomPagoTooltip />} cursor={{ fill: '#47AA66', opacity: 0.05 }} />
                    <Legend />
                    <Bar dataKey="total_ventas" fill="#47AA66" name="Ingresos" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};