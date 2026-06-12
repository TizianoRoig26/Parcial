import { usePedidos } from "../hooks/pedidosHooks";
import { VistaCocina } from "../components/VistaCocina";

export const CocinaPage = () => {
  const {
    isLoading,
    isError,
  } = usePedidos();

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando productos...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar productos</div>;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl">
      <div className="mb-5">
        <div className="flex items-center justify-between pb-2 mb-5 border-b" >
          <div>
            <h1 className="text-3xl font-bold text-[#006D35] tracking-tight ">Gestión de Pedidos en Cocina</h1>
            <p className="text-gray-600 mt-1">Gestiona los pedidos en cocina</p>
          </div>
        </div>
      </div>
      <VistaCocina />
    </div>
  );
}
