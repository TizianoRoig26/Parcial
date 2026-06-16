export interface ResumenKPIsPublic{
    ventas_hoy: number;
    ticket_promedio: number ;
    pedidos_activos: number;
    mes_actual: string;
    total_mes_actual: number;
    cantidad_pedidos_mes: number;
}

export interface VentasPeriodoPublic {
    periodo: string;
    total: number;
    cantidad_pedidos: number;
}

export interface ProductosMasVendidosPublic {
    producto_nombre: string;
    cantidad: number;
    total_vendido: number;
}

export interface IngresosFormaPagoPublic {
    forma_pago: string;
    total: number;
}

export interface PedidosPorEstadoPublic {
    estado: string;
    cantidad: number;
}

