import apiClient from "../../auth/services/axiosInstance";
import type { UserPublic } from "../IUsuario";

const PATH = "/api/v1/auth";

export const getUsuarios = async (): Promise<UserPublic[]> => {
  const response = await apiClient.get<UserPublic[]>(`${PATH}/admin/usuarios`);
  return response.data;
};

export const createUsuario = async (
  data: Omit<UserPublic, "id" | "disabled" | "roles"> & { roles: string[]; password?: string },
): Promise<UserPublic> => {
  const response = await apiClient.post<UserPublic>(`${PATH}/register_trabajador`, data);
  return response.data;
};

export const updateUsuario = async (
  id: number,
  data: Partial<UserPublic> & { roles?: string[] },
): Promise<UserPublic> => {
  // Como no hay endpoint PATCH en el backend, si se actualizan roles,
  // asignamos los roles uno por uno.
  if (data.roles) {
    for (const role of data.roles) {
      await apiClient.post(`${PATH}/admin/usuarios/${id}/roles/${role}`);
    }
  }
  // Devolvemos el usuario actualizado obteniéndolo de nuevo
  const response = await apiClient.get<UserPublic>(`${PATH}/admin/usuarios/${id}`);
  return response.data;
};

export const desactivarUsuario = async (id: number): Promise<void> => {
  await apiClient.post(`${PATH}/admin/usuarios/${id}/desactivar`);
};

export const activarUsuario = async (id: number): Promise<void> => {
  await apiClient.post(`${PATH}/admin/usuarios/${id}/activar`);
};
