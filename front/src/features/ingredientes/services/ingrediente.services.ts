import apiClient from "../../auth/services/axiosInstance";
import type { IIngrediente } from "../IIngredientes";

const PATH = "/ingredientes";

type PaginatedResponse = { data: IIngrediente[]; total: number };

export const getIngredientes = async (offset: number, limit: number): Promise<PaginatedResponse> => {
  const response = await apiClient.get<PaginatedResponse>(`${PATH}?offset=${offset}&limit=${limit}`);
  console.log(response.data.data);
  response.data.data.sort((a, b) => {
    return a.nombre.localeCompare(b.nombre);
  });
  return response.data;
};


export const createIngrediente = async (
  data: Omit<IIngrediente, "id" >,
): Promise<IIngrediente> => {
  const response = await apiClient.post<IIngrediente>(PATH, data);
  return response.data;
};


export const updateIngrediente = async (
  id: number,
  data: Partial<IIngrediente>,
): Promise<IIngrediente> => {
  const { nombre, descripcion, es_alergeno, is_active } = data;
  const response = await apiClient.patch<IIngrediente>(`${PATH}/${id}`, {
    nombre,
    descripcion,
    es_alergeno,
    is_active,
  });
  return response.data;
};

export const changeStateIngrediente = async (id: number): Promise<IIngrediente> => {
  const response = await apiClient.patch<IIngrediente>(`${PATH}/estado/${id}`);
  return response.data;
};


export const deleteIngrediente = async (id: number): Promise<void> => {
  await apiClient.delete(`${PATH}/${id}`);
};

