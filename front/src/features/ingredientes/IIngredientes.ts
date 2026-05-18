export interface IIngrediente {
  id?: number;
  nombre: string;
  descripcion: string;
  es_alergeno: boolean;
  is_active?: boolean;
}
