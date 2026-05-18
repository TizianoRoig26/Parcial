export interface ICategoria {
    id?: number;
    nombre:string;
    descripcion?: string;
    imagen_url?: string;
    is_active: boolean;
    parent_id?: number | null; 
}