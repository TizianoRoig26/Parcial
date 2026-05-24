import type { IPedido } from "../IPedido";
import apiClient from "../../auth/services/axiosInstance";

const PATH = "/pedidos";  
const AUTH = "/api/v1/auth";

type PaginatedResponse = { data: IPedido[]; total: number };

export const getPedidos = async (id?: number): Promise<PaginatedResponse> => {
  const response = await apiClient.get<PaginatedResponse>(`${PATH}/${id ?? ''}`);
  response.data.data.sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);

    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;

    return 0;
  });
  console.log(response.data);
  return response.data;
};

export const getUserById = async (id: number): Promise<any> => {
  const response = await apiClient.get(`${AUTH}/admin/usuarios/${id}`);
  console.log(response.data);
  return response.data;
}

export const getDetalle = async (id: number): Promise<any> => {
  const response = await apiClient.get(`${PATH}/${id}/detalles`);
  console.log(response.data);
  return response.data;
}

export const cambioEstado = async (id: number, estado: string): Promise<any> => {
  const response = await apiClient.patch(`${PATH}/${id}/estado`, { estado });
  console.log(response.data);
  return response.data;
}

