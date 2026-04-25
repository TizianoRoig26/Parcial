import type { IProducto } from "../types/IProducto";

const BASE_URL = `${import.meta.env.VITE_API_URL}/productos`;

type PaginatedResponse = { data: IProducto[]; total: number };

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json();
    const msg = typeof errorData.detail === "string"
      ? errorData.detail
      : JSON.stringify(errorData.detail);
    throw new Error(msg || "Error en la petición");
  }
  return response.json();
};

export const getProductos = async (): Promise<PaginatedResponse> => {
  const response = await fetch(BASE_URL);
  return handleResponse<PaginatedResponse>(response);
};

export const createProducto = async (
  data: Omit<IProducto, "id" | "categorias" | "ingredientes">,
): Promise<IProducto> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<IProducto>(response);
};

export const updateProducto = async (
  id: number,
  data: Partial<IProducto>,
): Promise<IProducto> => {
  const { nombre, descripcion, precio_base, stock_cantidad, imagen_url } = data;
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, descripcion, precio_base, stock_cantidad, imagen_url }),
  });
  return handleResponse<IProducto>(response);
};

export const deleteProducto = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Error al eliminar producto ${id}`);
};

export const assignCategorias = async (
  productoId: number,
  categoria_ids: number[],
): Promise<IProducto> => {
  const response = await fetch(`${BASE_URL}/${productoId}/categorias`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoria_ids }),
  });
  return handleResponse<IProducto>(response);
};

export const assignIngredientes = async (
  productoId: number,
  ingrediente_ids: number[],
): Promise<IProducto> => {
  const response = await fetch(`${BASE_URL}/${productoId}/ingredientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ingrediente_ids }),
  });
  return handleResponse<IProducto>(response);
};
