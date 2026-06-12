import type { IProducto } from "../productos";

export interface IPedido {
  id?: number;
  usuario_id: number;
  direccion_id: number;
  estado_codigo: string;
  forma_pago_codigo: string;
  subtotal: number;
  descuento: number;
  costo_envio: number;
  total: number;
  notas: string;
  pagado: boolean;
  created_at: string;
}

export interface FormaPago {
    codigo: string;
    descripcion: string;
    habilitado: boolean;
}

export interface EstadoPedido {
    codigo: string;
    descripcion: string;
    orden: number;
    es_terminal: boolean;
}


export interface IDetallePedido {
  pedido_id: number;
  cantidad: number;
  precio: number;
  subtotal: number;
  productos?: IProducto[];
}

export interface IDireccion {
  id?: number;
  alias: string;
  calle: string;
  numero: string;
  ciudad: string;
  provincia: string;
  codigo_postal: string;
  pais: string;
  usuario_id: number;
}