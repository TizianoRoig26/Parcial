import { usePedidos, UsuarioNombre, PedidoDetalles, PedidoDireccion } from "../hooks/pedidosHooks";
import { BotonCambioEstado } from "./BotonCambioEstado";
import { Link } from "react-router-dom";

export const VistaSecundaria = () => {
    const {
        pedidos,
        handleObtenerTiempo,
        handleCambiaEstado
    } = usePedidos();

    return (
        <div className="flex flex-row gap-5 h-full min-h-0">
            <div className="py-5 bg-[#E5E4C1] flex flex-col h-full w-full rounded-2xl border-2 border-[#C9C8A6] custom-scrollbar shadow-md">
              <div className="px-5 pb-5 flex justify-between items-center gap-2 border-b-2 border-[#C9C8A6] w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006D35"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M11.87 21.48a1.992 1.992 0 0 1 -1.283 -.58l-4.244 -4.243a8 8 0 1 1 13.355 -3.474" /><path d="M15 19l2 2l4 -4" /></svg>
                    <span className="text-xl text-[#006D35] font-bold">Finalizados</span>
                  </div>
                <span className="bg-[#50834D] text-white px-3 py-1 rounded-full">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "ENTREGADO" || pedido.estado_codigo == "CANCELADO").length}
                </span>
              </div>
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                <ul className="flex flex-col">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "ENTREGADO" || pedido.estado_codigo == "CANCELADO").map((pedido) => (
                    <li key={pedido.id} className="mb-4 ">
                      <article className="flex flex-col border-3 gap-2 border-[#929373] rounded-xl p-4">
                        <div className="flex justify-between ">
                          <span className="text-lg text-[#006D35] hover:underline font-bold">
                            <Link to={`/pedidos/${pedido.id}`}>#{pedido.id}</Link> - <span className={pedido.estado_codigo == "ENTREGADO" ? "text-green-600" : "text-red-600"}>{pedido.estado_codigo}</span>
                          </span>
                          
                          <span>
                            
                            {pedido.pagado == true ? <span className="text-green-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                              <path d="M14.8 9a2 2 0 0 0 -1.8 -1h-2a2 2 0 1 0 0 4h2a2 2 0 1 1 0 4h-2a2 2 0 0 1 -1.8 -1" />
                              <path d="M12 7v10" />
                            </svg></span> 
                            : 
                            <span className="text-red-600"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M14.8 9a2 2 0 0 0 -1.8 -1h-1m-2.82 1.171a2 2 0 0 0 1.82 2.829h1m2.824 2.822a2 2 0 0 1 -1.824 1.178h-2a2 2 0 0 1 -1.8 -1" />
                              <path d="M20.042 16.045a9 9 0 0 0 -12.087 -12.087m-2.318 1.677a9 9 0 1 0 12.725 12.73" />
                              <path d="M12 6v2m0 8v2" />
                              <path d="M3 3l18 18" />
                            </svg></span>}
                          </span>
                          <span className="text-sm font-medium  ">
                            HACE {handleObtenerTiempo(pedido.created_at)} MIN
                          </span>
                        </div>
                        <div className="flex flex-col justify-between items-start">
                          <span className="text-xl"><UsuarioNombre id={pedido.usuario_id} /></span>
                          <span>Notas: {pedido.notas}</span> <span className="text-[#006D35] font-semibold">${pedido.total}</span>
                        </div>
                        <div className="bg-[#F4F3CF] rounded-xl p-2 w-full flex justify-center items-center font-medium text-sm">
                          <PedidoDetalles pedidoId={pedido.id}/> 
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

        </div>

    );
}