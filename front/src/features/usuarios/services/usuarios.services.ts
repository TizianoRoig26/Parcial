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
  if (data.roles) {
    // Obtenemos los roles actuales del usuario desde la API para poder comparar
    const currentUserRes = await apiClient.get<UserPublic>(`${PATH}/admin/usuarios/${id}`);
    const currentRoles = currentUserRes.data.roles?.map(r => r.codigo.toUpperCase()) ?? [];
    
    const newRoles = data.roles.map(r => r.toUpperCase());

    // Roles que se agregaron
    const rolesToAdd = newRoles.filter(r => !currentRoles.includes(r));
    // Roles que se quitaron
    const rolesToRemove = currentRoles.filter(r => !newRoles.includes(r));

    for (const role of rolesToAdd) {
      await apiClient.post(`${PATH}/admin/usuarios/${id}/roles/${role}`);
    }

    for (const role of rolesToRemove) {
      await apiClient.delete(`${PATH}/admin/usuarios/${id}/roles/${role}`);
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
