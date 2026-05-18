import type { ICategoria } from "../../types/ICategoria";
import type { IIngrediente } from "../../types/IIngredientes";

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

