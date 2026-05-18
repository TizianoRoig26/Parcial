import type { ICategoria } from "../categoria/ICategoria";
import type { IIngrediente } from "../ingredientes/IIngredientes";

export interface IProducto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  stock_cantidad: number;
  imagen_url: string;
  is_active?: boolean;
  categorias?: ICategoria[];
  ingredientes?: IIngrediente[];
}

