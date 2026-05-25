import { usePedidos, UsuarioNombre, PedidoDetalles } from "../hooks/pedidosHooks";
import { VistaPrincipal } from "../components/VistaPrincipal";
import { VistaSecundaria } from "../components/VistaSecundaria";
export const PedidoPage = () => {
  const {
    pedidos,
    isLoading,
    isError,
    handleObtenerTiempo,
    handleCambiaEstado,
    vista,
    handleCambiarVista
  } = usePedidos();

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando productos...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar productos</div>;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl">
      <div className="mb-5">
        <div className="flex items-center justify-between pb-2 mb-5 border-b" >
          <div>
            <h1 className="text-3xl font-bold text-[#006D35] tracking-tight ">Gestión de Pedidos</h1>
            <p className="text-gray-600 mt-1">Gestiona los pedidos realizados</p>
          </div>
          <button onClick={handleCambiarVista} className="px-4 py-2 rounded-lg bg-[#006D35] text-white hover:bg-[#006D35]/80 transition-colors">
            Cambiar vista
          </button>
        </div>
      </div>
      {vista === "principal" ? (
        <VistaPrincipal />
      ) : (
        <VistaSecundaria />
      )}
    </div>
  );
}
