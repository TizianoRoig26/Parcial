import type { IIngrediente } from "../types/IIngredientes";

const BASE_URL = `${import.meta.env.VITE_API_URL}/ingredientes`;

type PaginatedResponse = { data: IIngrediente[]; total: number };

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

export const getIngredientes = async (): Promise<PaginatedResponse> => {
  const response = await fetch(BASE_URL);
  return handleResponse<PaginatedResponse>(response);
};

export const createIngrediente = async (
  data: Omit<IIngrediente, "id">,
): Promise<IIngrediente> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<IIngrediente>(response);
};

export const updateIngrediente = async (
  id: number,
  data: Partial<IIngrediente>,
): Promise<IIngrediente> => {
  const { nombre, descripcion, es_alergeno } = data;
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, descripcion, es_alergeno }),
  });
  return handleResponse<IIngrediente>(response);
};

export const deleteIngrediente = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error(`Error al eliminar ingrediente ${id}`);
};
