import type { IProducto } from "../IProducto";
import apiClient from "../../auth/services/axiosInstance";

const PATH = "/productos";

type PaginatedResponse = { data: IProducto[]; total: number };
export const getProductos = async (): Promise<PaginatedResponse> => {
  const response = await apiClient.get<PaginatedResponse>(PATH);
  return response.data;
};

export const createProducto = async (
  data: Omit<IProducto, "id" | "categorias" | "ingredientes">,
): Promise<IProducto> => {
  const response = await apiClient.post<IProducto>(PATH, data);
  return response.data;
};


export const updateProducto = async (
  id: number,
  data: Partial<IProducto>,
): Promise<IProducto> => {
  const { nombre, descripcion, precio_base, stock_cantidad, imagen_url } = data;
  const response = await apiClient.patch<IProducto>(`${PATH}/${id}`, {
    nombre,
    descripcion,
    precio_base,
    stock_cantidad,
    imagen_url,
  });
  return response.data;
};


export const deleteProducto = async (id: number): Promise<void> => {
  await apiClient.delete(`${PATH}/${id}`);
};


export const assignCategorias = async (
  productoId: number,
  categoria_ids: number[],
): Promise<IProducto> => {
  const response = await apiClient.post<IProducto>(`${PATH}/${productoId}/categorias`, {
    categoria_ids,
  });
  return response.data;
};


export const assignIngredientes = async (
  productoId: number,
  ingrediente_ids: number[],
): Promise<IProducto> => {
  const response = await apiClient.post<IProducto>(`${PATH}/${productoId}/ingredientes`, {
    ingrediente_ids,
  });
  return response.data;
};
