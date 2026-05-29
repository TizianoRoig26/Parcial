import { useParams, Link } from "react-router-dom";
import { UsuarioNombre, PedidoDireccion, usePedidoDetail } from "../hooks/pedidosHooks";

export const PedidoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const pedidoId = Number(id);

  const {
    pedido,
    isPedidoLoading,
    isPedidoError,
    detalles,
    isDetallesLoading,
    handleAvanzarEstado,
    isAdmin,
    isPedidos,
  } = usePedidoDetail(pedidoId);

  if (isNaN(pedidoId)) {
    return (
      <div className="p-8 text-center bg-[#E5E4C1] rounded-2xl border border-[#0D4012]">
        <h2 className="text-2xl font-bold text-red-600">ID de pedido inválido</h2>
        <Link to="/pedidos" className="mt-4 inline-block text-[#006D35] hover:underline font-semibold">
          Volver a Pedidos
        </Link>
      </div>
    );
  }

  if (isPedidoLoading || isDetallesLoading) {
    return (
      <div className="p-8 text-center text-black animate-pulse">
        Cargando detalles del pedido #{pedidoId}...
      </div>
    );
  }

  if (isPedidoError || !pedido) {
    return (
      <div className="p-8 text-center bg-[#E5E4C1] rounded-2xl border border-[#0D4012]">
        <h2 className="text-2xl font-bold text-red-600">Error al cargar el pedido</h2>
        <p className="text-gray-700 mt-2">No se pudo encontrar el pedido #{pedidoId}.</p>
        <Link to="/pedidos" className="mt-4 inline-block text-[#006D35] hover:underline font-semibold">
          Volver a Pedidos
        </Link>
      </div>
    );
  }

  const getSiguienteEstado = (estadoActual: string): string | null => {
    switch (estadoActual) {
      case "PENDIENTE":
        return "CONFIRMADO";
      case "CONFIRMADO":
        return "EN_PREP";
      case "EN_PREP":
        return "EN_CAMINO";
      case "EN_CAMINO":
        return "ENTREGADO";
      default:
        return null;
    }
  };

  const getBotonLabel = (siguienteEstado: string): string => {
    switch (siguienteEstado) {
      case "CONFIRMADO":
        return "Confirmar Pedido";
      case "EN_PREP":
        return "Iniciar Preparación";
      case "EN_CAMINO":
        return "Despachar Envío";
      case "ENTREGADO":
        return "Marcar como Entregado";
      default:
        return "Avanzar Estado";
    }
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "CONFIRMADO":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "EN_PREP":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "EN_CAMINO":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "ENTREGADO":
        return "bg-green-100 text-green-800 border-green-300";
      case "CANCELADO":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const siguienteEstado = getSiguienteEstado(pedido.estado_codigo);

  const sePuedeCancelar = pedido.estado_codigo === "PENDIENTE" || pedido.estado_codigo === "CONFIRMADO" || (pedido.estado_codigo === "EN_PREP" && (isAdmin || isPedidos));

  return (
    <div className="w-full flex-1 flex flex-col p-6 bg-[#F4F3CF] min-h-0 overflow-y-auto ">
      <div className="mb-6  flex justify-between items-center">
        <Link
          to="/pedidos"
          className="flex items-center gap-2 text-[#006D35] hover:text-[#004d25] font-semibold transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M5 12l14 0" />
            <path d="M5 12l6 6" />
            <path d="M5 12l6 -6" />
          </svg>
          Volver a Pedidos
        </Link>

        <div className="flex gap-2">
          {sePuedeCancelar && (
            <button
              onClick={() => {
                const motivo = prompt("Ingrese el motivo de la cancelación:");
                if (motivo !== null) {
                  handleAvanzarEstado("CANCELADO", motivo || "Cancelado por el administrador");
                }
              }}
              className="px-4 py-2 border border-red-500 text-red-600 bg-red-50 hover:bg-red-100 rounded-full font-semibold transition-colors duration-200"
            >
              Cancelar Pedido
            </button>
          )}

          {siguienteEstado && (
            <button
              onClick={() => handleAvanzarEstado(siguienteEstado)}
              className="px-4 py-2 bg-[#006D35] text-white hover:bg-[#004d25] rounded-full font-semibold transition-colors duration-200 shadow-md"
            >
              {getBotonLabel(siguienteEstado)}
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#E5E4C1] border border-[#0D4012]  p-6 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0D4012]">Pedido #{pedido.id}</h1>
          <p className="text-gray-700 mt-1">
            Realizado el: <span className="font-semibold">{new Date(pedido.created_at).toLocaleString()}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-4 py-1.5 rounded-full border text-sm font-bold shadow-sm ${getBadgeColor(pedido.estado_codigo)}`}>
            {pedido.estado_codigo}
          </span>
          <span className="text-2xl font-bold text-[#0D4012]">
            Total: ${pedido.total}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-[#E5E4C1] p-5 rounded-2xl border border-[#0D4012] shadow-md flex-1">
            <h3 className="text-lg font-bold text-[#0D4012] border-b border-[#0D4012] pb-2 mb-4">Información del Cliente</h3>
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-xs text-gray-600 block">Nombre Completo</span>
                <span className="font-bold text-gray-800 text-lg">
                  <UsuarioNombre id={pedido.usuario_id} />
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block">Forma de Pago</span>
                <span className="font-semibold text-gray-800">{pedido.forma_pago_codigo}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#E5E4C1] p-5 rounded-2xl border border-[#0D4012] shadow-md flex-1">
            <h3 className="text-lg font-bold text-[#0D4012] border-b border-[#0D4012] pb-2 mb-4">Información de Entrega</h3>
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-xs text-gray-600 block">Dirección de Envío</span>
                <span className="font-semibold text-gray-800 block mt-1">
                  <PedidoDireccion id={pedido.direccion_id} />
                </span>
              </div>
              {pedido.notas && (
                <div>
                  <span className="text-xs text-gray-600 block">Notas Especiales</span>
                  <p className="text-sm text-gray-800 bg-[#F4F3CF] p-3 rounded-xl border border-[#C9C8A6] mt-1 whitespace-pre-wrap italic">
                    "{pedido.notas}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-[#E5E4C1] p-5 rounded-2xl border border-[#0D4012] shadow-md h-full flex flex-col">
            <h3 className="text-lg font-bold text-[#0D4012] border-b border-[#0D4012] pb-2 mb-4">Detalle de Productos</h3>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#0D4012] text-xs text-[#0D4012] uppercase font-bold">
                    <th className="py-2">Producto</th>
                    <th className="py-2 text-center">Cantidad</th>
                    <th className="py-2 text-right">Precio Unitario</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9C8A6] text-gray-800">
                  {detalles?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[#C9C8A6]/20">
                      <td className="py-3">
                        <span className="font-bold block">{item.nombre_snapshot}</span>
                        {item.personalizacion && item.personalizacion.length > 0 && (
                          <span className="text-xs text-gray-500 italic block mt-0.5">
                            Personalizado (Ingredientes eliminados)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center font-semibold">x{item.cantidad}</td>
                      <td className="py-3 text-right">${item.precio_snapshot}</td>
                      <td className="py-3 text-right font-semibold">${item.subtotal_snap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 border-t border-[#0D4012] pt-4 flex flex-col gap-2 align-end self-end w-full md:w-80">
              <div className="flex justify-between text-sm text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">${pedido.subtotal}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Descuento:</span>
                <span className="font-semibold">-${pedido.descuento}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Costo de Envío:</span>
                <span className="font-semibold">${pedido.costo_envio}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-[#0D4012] border-t border-[#C9C8A6] pt-2 mt-2">
                <span>Total:</span>
                <span>${pedido.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
