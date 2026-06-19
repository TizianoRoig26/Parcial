import type { IUnidadMedida } from "../IUnidadMedida";
import apiClient from "../../auth/services/axiosInstance";

const PATH = "/api/v1/unidades-medida";

type PaginatedResponse = { data: IUnidadMedida[]; total: number };

export const getUnidadesMedida = async (): Promise<PaginatedResponse> => {
  const response = await apiClient.get<PaginatedResponse>(`${PATH}`);
  return response.data;
};

export const getUnidadesMedidaById = async (id: number): Promise<IUnidadMedida> => {
  const response = await apiClient.get<IUnidadMedida>(`${PATH}/${id}`);
  return response.data;
};
