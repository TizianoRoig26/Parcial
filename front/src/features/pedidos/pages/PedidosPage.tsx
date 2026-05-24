import { usePedidos, UsuarioNombre, PedidoDetalles } from "../hooks/pedidosHooks";

export const PedidoPage = () => {
  const {
    pedidos,
    isLoading,
    isError,
    handleObtenerTiempo,
    handleCambiaEstado
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
        </div>
      </div>
        <div className="flex flex-row gap-5 h min-h-0">
            <div className="py-5 bg-[#E5E4C1] flex flex-col h-full w-full rounded-2xl border-2 border-[#C9C8A6] custom-scrollbar">
              <div className="px-5 pb-5 flex justify-between items-center gap-2 border-b-2 border-[#C9C8A6] w-full">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006D35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-clipboard-list">
                    <path stroke="none" d="M0 0h24v24H0z" fill="[#C9C8A6]" />
                    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                    <path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" />
                    <path d="M9 12l.01 0" />
                    <path d="M13 12l2 0" />
                    <path d="M9 16l.01 0" />
                    <path d="M13 16l2 0" />
                  </svg>
                  <span className="text-xl text-[#006D35] font-bold">Por Confirmar</span>
                </div>
                <span className="bg-[#50834D] text-white px-3 py-1 rounded-full">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "PENDIENTE").length}
                </span>
              </div>
              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                <ul className="flex flex-col">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "PENDIENTE").map((pedido) => (
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
                          <button className="bg-[#F4F3CF] text-[#929373] border-1 border-[#929373] px-3 py-1 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                <path d="M18.364 5.636l-12.728 12.728" />
                              </svg>
                          </button>
                          <span>${pedido.total}</span>
                          <button 
                          className="bg-[#50834D] text-white px-2 py-1 rounded-full"
                          onClick={() => handleCambiaEstado(pedido.id, "PREPARACION")}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M13 7h-6l4 5l-4 5h6l4 -5l-4 -5" />
                              </svg>
                          </button>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006D35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-clipboard-list">
                    <path stroke="none" d="M0 0h24v24H0z" fill="[#C9C8A6]" />
                    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                    <path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" />
                    <path d="M9 12l.01 0" />
                    <path d="M13 12l2 0" />
                    <path d="M9 16l.01 0" />
                    <path d="M13 16l2 0" />
                  </svg>
                  <span className="text-xl text-[#006D35] font-bold">En Preparación</span>
                </div>
                <span className="bg-[#50834D] text-white px-3 py-1 rounded-full">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "EN_PREP").length}
                </span>
              </div>
              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                <ul className="flex flex-col">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "EN_PREP").map((pedido) => (
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
                          <button className="bg-[#F4F3CF] text-[#929373] border-1 border-[#929373] px-3 py-1 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                <path d="M18.364 5.636l-12.728 12.728" />
                              </svg>
                          </button>
                          <span>${pedido.total}</span>
                          <button 
                          className="bg-[#50834D] text-white px-2 py-1 rounded-full"
                          onClick={() => handleCambiaEstado(pedido.id, "PREPARACION")}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M13 7h-6l4 5l-4 5h6l4 -5l-4 -5" />
                              </svg>
                          </button>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006D35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-clipboard-list">
                    <path stroke="none" d="M0 0h24v24H0z" fill="[#C9C8A6]" />
                    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2" />
                    <path d="M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2" />
                    <path d="M9 12l.01 0" />
                    <path d="M13 12l2 0" />
                    <path d="M9 16l.01 0" />
                    <path d="M13 16l2 0" />
                  </svg>
                  <span className="text-xl text-[#006D35] font-bold">Por Confirmar</span>
                </div>
                <span className="bg-[#50834D] text-white px-3 py-1 rounded-full">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "PENDIENTE").length}
                </span>
              </div>
              <div className="p-5 overflow-y-auto flex-1 min-h-0">
                <ul className="flex flex-col">
                  {pedidos?.data.filter(pedido => pedido.estado_codigo == "PENDIENTE").map((pedido) => (
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
                          <button className="bg-[#F4F3CF] text-[#929373] border-1 border-[#929373] px-3 py-1 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                                <path d="M18.364 5.636l-12.728 12.728" />
                              </svg>
                          </button>
                          <span>${pedido.total}</span>
                          <button 
                          className="bg-[#50834D] text-white px-2 py-1 rounded-full"
                          onClick={() => handleCambiaEstado(pedido.id, "PREPARACION")}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M13 7h-6l4 5l-4 5h6l4 -5l-4 -5" />
                              </svg>
                          </button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
        </div>
    </div>
  );
}
{/* <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-arrow-badge-left">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M11 17h6l-4 -5l4 -5h-6l-4 5l4 5" />
                          </svg> */}