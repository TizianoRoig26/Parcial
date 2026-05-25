import { usePedidos } from "../hooks/pedidosHooks";

export const BotonCambioEstado = ({pedidoId}: {pedidoId: number}) => {
    const { handleCambiaEstado } = usePedidos();
    return (
        <button title="cambioestado"
        className="bg-[#50834D] text-white px-2 py-1 rounded-full"
        onClick={() => handleCambiaEstado(pedidoId)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M13 7h-6l4 5l-4 5h6l4 -5l-4 -5" />
            </svg>
        </button>
    )
}
