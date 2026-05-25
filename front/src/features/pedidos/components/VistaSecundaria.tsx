import { usePedidos, UsuarioNombre, PedidoDetalles } from "../hooks/pedidosHooks";
import { BotonCambioEstado } from "./BotonCambioEstado";

export const VistaSecundaria = () => {
    const {
        pedidos,
        handleObtenerTiempo,
        handleCambiaEstado
    } = usePedidos();

    return (
        <div className="flex flex-row gap-5 h-full min-h-0">
            <div className="py-5 bg-[#E5E4C1] flex flex-col h-full w-full rounded-2xl border-2 border-[#C9C8A6] custom-scrollbar">
              <div className="px-5 pb-5 flex justify-between items-center gap-2 border-b-2 border-[#C9C8A6] w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006D35">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M2 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                    <path d="M16 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                    <path d="M7.5 14h5l4 -4h-10.5m1.5 4l4 -4" />
                    <path d="M13 6h2l1.5 3l2 4" />
                  </svg>
                  <span className="text-xl text-[#006D35] font-bold">En Camino</span>
                </div>
                <span className="bg-[#50834D] text-white px-3 py-1 rounded-full">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "EN_CAMINO").length}
                </span>
              </div>
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                <ul className="flex flex-col">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "EN_CAMINO").map((pedido) => (
                    <li key={pedido.id} className="mb-4 ">
                      <article className="flex flex-col border-3 gap-2 border-[#929373] rounded-xl p-4">
                        <div className="flex justify-between ">
                          <span className="text-lg text-[#006D35]">
                            #{pedido.id}
                          </span>
                          <span className="text-sm font-medium  ">
                            HACE {handleObtenerTiempo(pedido.created_at)} MIN
                          </span>
                        </div>
                        <div className="flex flex-col justify-between items-start">
                          <span className="text-xl"><UsuarioNombre id={pedido.usuario_id} /></span>
                          <span>Notas: {pedido.notas}</span>
                        </div>
                        <div className="bg-[#F4F3CF] rounded-xl p-2 w-full flex justify-center items-center font-medium text-sm">
                          <PedidoDetalles pedidoId={pedido.id}/>
                        </div>
                        <div className="flex justify-around text-[#006D35] font-semibold">
                          <button
                           className="bg-[#F4F3CF] text-[#929373] border-1 border-[#929373] px-3 py-1 rounded-full" title="cambio estado"
                           onClick={() => handleCambiaEstado(pedido.id, true)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                <path d="M18.364 5.636l-12.728 12.728" />
                              </svg>
                          </button>
                          <span>${pedido.total}</span>
                          <BotonCambioEstado pedidoId={pedido.id} />
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="py-5 bg-[#E5E4C1] flex flex-col h-full w-full rounded-2xl border-2 border-[#C9C8A6] custom-scrollbar">
              <div className="px-5 pb-5 flex justify-between items-center gap-2 border-b-2 border-[#C9C8A6] w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006D35"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M11.87 21.48a1.992 1.992 0 0 1 -1.283 -.58l-4.244 -4.243a8 8 0 1 1 13.355 -3.474" /><path d="M15 19l2 2l4 -4" /></svg>
                    <span className="text-xl text-[#006D35] font-bold">Entregado</span>
                  </div>
                <span className="bg-[#50834D] text-white px-3 py-1 rounded-full">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "ENTREGADO").length}
                </span>
              </div>
              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                <ul className="flex flex-col">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "ENTREGADO").map((pedido) => (
                    <li key={pedido.id} className="mb-4 ">
                      <article className="flex flex-col border-3 gap-2 border-[#929373] rounded-xl p-4">
                        <div className="flex justify-between ">
                          <span className="text-lg text-[#006D35]">
                            #{pedido.id}
                          </span>
                          <span className="text-sm font-medium  ">
                            HACE {handleObtenerTiempo(pedido.created_at)} MIN
                          </span>
                        </div>
                        <div className="flex flex-col justify-between items-start">
                          <span className="text-xl"><UsuarioNombre id={pedido.usuario_id} /></span>
                          <span>Notas: {pedido.notas}</span>
                        </div>
                        <div className="bg-[#F4F3CF] rounded-xl p-2 w-full flex justify-center items-center font-medium text-sm">
                          <PedidoDetalles pedidoId={pedido.id}/>
                        </div>
                        <div className="flex justify-around text-[#006D35] font-semibold">
                          <button 
                          className="bg-[#F4F3CF] text-[#929373] border-1 border-[#929373] px-3 py-1 rounded-full " title="cambio estado"
                          onClick={() => handleCambiaEstado(pedido.id, true)}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" >
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                <path d="M18.364 5.636l-12.728 12.728" />
                              </svg>
                          </button>
                          <span>${pedido.total}</span>
                          <BotonCambioEstado pedidoId={pedido.id} />
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