import type { ICategoria } from "../categoria/ICategoria";
import type { IIngrediente } from "../ingredientes/IIngredientes";
import type { IUnidadMedida } from "../unidadMedida/IUnidadMedida";

export interface IProducto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  imagen_url: string;
  is_active?: boolean;
  unidad_venta_id?: number;
  unidad_medida?: IUnidadMedida;
  categorias?: ICategoria[];
  ingredientes?: IIngrediente[];
}

