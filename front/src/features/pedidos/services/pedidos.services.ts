import type { IPedido } from "../IPedido";
import apiClient from "../../auth/services/axiosInstance";

const PATH = "/api/v1/pedidos";
const AUTH = "/api/v1/auth";
const DIREC = "/api/v1/direcciones";

type PaginatedResponse = { data: IPedido[]; total: number };

export const getPedidos = async (id?: number): Promise<PaginatedResponse> => {
  const response = await apiClient.get<PaginatedResponse>(`${PATH}/${id ?? ''}`);
  response.data.data.sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);

    if (dateA > dateB) return 1;
    if (dateA < dateB) return -1;

    return 0;
  });
  console.log(response.data);
  return response.data;
};

export const getUserById = async (id: number): Promise<any> => {
  const response = await apiClient.get(`${AUTH}/usuarios/nombre/${id}`);
  console.log(response.data);
  return response.data;
}

export const getDetalle = async (id: number): Promise<any> => {
  const response = await apiClient.get(`${PATH}/${id}/detalles`);
  console.log(response.data);
  return response.data;
}

export const cambioEstado = async (id: number, estado: string, motivo?: string): Promise<any> => {
  const body: any = { estado_hacia: estado };
  if (estado === "CANCELADO") {
    body.motivo = motivo || "Cancelado por el administrador";
  } else if (motivo) {
    body.motivo = motivo;
  }
  const response = await apiClient.patch(`${PATH}/${id}/estado`, body);
  console.log(response.data);
  return response.data;
}

export const pagoPedido = async (id: number): Promise<any> => {
  const response = await apiClient.patch(`${PATH}/${id}/pagar`);
  console.log(response.data);
  return response.data;
}

export const getDireccion = async (id: number): Promise<any> => {
  const response = await apiClient.get(`${DIREC}/${id}`);
  console.log(response.data);
  return response.data;
}

export const getPedidoById = async (id: number): Promise<IPedido> => {
  const response = await apiClient.get<IPedido>(`${PATH}/${id}`);
  return response.data;
};

export const getEstadisticas = async ():Promise<any> => {
  const response = await apiClient.get(`${PATH}/cajero/estadisticas`);
  console.log(response.data);
  return response.data;
}

