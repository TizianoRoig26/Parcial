import apiClient from "./axiosInstance";
import type { UserPublic, UserRegisterPayload } from "../types/index";

const AUTH = "/api/v1/auth";

/**
 * 
 * Login con OAuth2 Password Flow.
 *
 * El backend responde con `Set-Cookie: access_token=...; HttpOnly; SameSite=Lax`.
 * El navegador almacena la cookie y la envía automáticamente en cada request
 * siguiente. El JWT nunca toca el código JavaScript.
 *
 * Los interceptores de axios manejan automáticamente:   
 * - Inclusión de credentials (cookies)
 * - Errores 401 (sesión expirada)
 */

export async function requestLogin(
  username: string,
  password: string,
): Promise<void> {
  const body = new URLSearchParams({ username, password });
  await apiClient.post(`${AUTH}/token`, body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
}

function mapUser(user: any): UserPublic {
  const mainRole = user.roles?.[0]?.codigo?.toLowerCase() as any;
  return {
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    disabled: user.disabled,
    role: mainRole || "client",
  };
}



export async function requestRegister(
  payload: UserRegisterPayload,
): Promise<UserPublic> {
  const response = await apiClient.post<any>(
    `${AUTH}/register`,
    payload,
  );
  return mapUser(response.data);
}

/**
 * Rehidrata el estado de autenticación leyendo el usuario desde el backend.
 *
 * No recibe el token: el navegador lo envía automáticamente vía cookie
 * httpOnly. Si la cookie es válida → 200 con el usuario. Si no → 401.
 */
export async function requestMe(): Promise<UserPublic> {
  const response = await apiClient.get<any>(`${AUTH}/me`);
  return mapUser(response.data);
}

/** Le pide al backend que invalide la cookie httpOnly. */
export async function requestLogout(): Promise<void> {
  await apiClient.post(`${AUTH}/logout`);
}

export async function getUserById(id: number): Promise<UserPublic> {
  const response = await apiClient.get<any>(`${AUTH}/admin/usuarios/${id}`);
  return mapUser(response.data);
}

export async function getUsernameById(id: number): Promise<string> {
  const response = await apiClient.get<string>(`${AUTH}/usuarios/nombre/${id}`);
  return response.data;
}


