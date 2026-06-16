import type { IProducto } from "../IProducto";
import apiClient from "../../auth/services/axiosInstance";

const PATH = "/productos";

type PaginatedResponse = { data: IProducto[]; total: number };

export const getProductos = async (
  offset: number,
  limit: number,
  nombre?: string,
  categoriaId?: number
): Promise<PaginatedResponse> => {
  let url = `${PATH}?offset=${offset}&limit=${limit}`;
  if (nombre) {
    url += `&nombre=${encodeURIComponent(nombre)}`;
  }
  if (categoriaId) {
    url += `&categoria_id=${categoriaId}`;
  }
  const response = await apiClient.get<PaginatedResponse>(url);

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
  const { nombre, descripcion, precio_base, imagen_url, unidad_venta_id } = data;
  const response = await apiClient.patch<IProducto>(`${PATH}/${id}`, {
    nombre,
    descripcion,
    precio_base,
    imagen_url,
    unidad_venta_id,
  });
  return response.data;
};

export const changeStateProducto = async (id: number): Promise<IProducto> => {
  const response = await apiClient.patch<IProducto>(`${PATH}/estado/${id}`);
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


export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<{ url: string }>(
    `/imagenes/api/v1/uploads/imagen`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.url;
};

export const deleteImagen = async (publicId: string): Promise<void> => {
  await apiClient.delete(`/imagenes/api/v1/uploads/imagen/${encodeURIComponent(publicId)}`);
};