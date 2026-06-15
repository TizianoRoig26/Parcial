import type { ResumenKPIsPublic, VentasPeriodoPublic, IngresosFormaPagoPublic, PedidosPorEstadoPublic, ProductosMasVendidosPublic } from "../IEstadisticas";
import apiClient from "../../auth/services/axiosInstance";

const PATH = "/estadisticas";  

export const EstadisticasService = {

	async getResumenKPIs(): Promise<ResumenKPIsPublic> {
		const { data } = await apiClient.get<ResumenKPIsPublic>(`${PATH}/resumen`);
		console.log(data);
        return data;
	},

	async getVentasPeriodo(desde?: string, hasta?: string, agrupacion?: string): Promise<VentasPeriodoPublic[]> {
		const { data } = await apiClient.get<VentasPeriodoPublic[]>(`${PATH}/ventas`, {
			params: { desde, hasta, agrupacion }
		});
        console.log(data);
		return data;
	},

	async getIngresosFormaPago(desde?: string, hasta?: string): Promise<IngresosFormaPagoPublic[]> {
		const { data } = await apiClient.get<IngresosFormaPagoPublic[]>(`${PATH}/ingresos`, {
            params: { desde, hasta}
        });
        console.log(data);
		return data;
	},

	async getPedidosPorEstado(): Promise<PedidosPorEstadoPublic[]> {
		const { data } = await apiClient.get<PedidosPorEstadoPublic[]>(`${PATH}/pedidos-por-estado`);
		return data;
	},

	async getProductosMasVendidos(): Promise<ProductosMasVendidosPublic[]> {
		const { data } = await apiClient.get<ProductosMasVendidosPublic[]>(`${PATH}/productos-top`);
		return data;
	}
}