import type { ICategoria } from "../ICategoria";
import apiClient from "../../auth/services/axiosInstance";

const PATH = "/categorias";

type PaginatedResponse = { data: ICategoria[]; total: number };

export const createCategory = async (
  newCategory: Omit<ICategoria, "id">,
): Promise<ICategoria> => {
  try {
    const response = await apiClient.post<ICategoria>(PATH, newCategory);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

export const getCategorias = async (): Promise<PaginatedResponse> => {
  try {
    const response = await apiClient.get<PaginatedResponse>(PATH);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

export const getCategoryById = async (id: number): Promise<ICategoria> => {
  try {
    const response = await apiClient.get<ICategoria>(`${PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

export const updateCategory = async (
  id: string,
  category: Partial<ICategoria>,
): Promise<ICategoria> => {
  try {
    const { nombre, descripcion, imagen_url, parent_id } = category;
    const body = { nombre, descripcion, imagen_url, parent_id };

    const response = await apiClient.patch<ICategoria>(`${PATH}/${id}`, body);

    return response.data;
  } catch (error) {
    console.log(error);
    throw error; 
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${PATH}/${id}`);
  } catch (error) {
    console.log(error);
    throw error; 
  }
};


