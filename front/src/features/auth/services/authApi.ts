import apiClient from "./axiosInstance";
import type { UserPublic, UserRegisterPayload } from "../types/index";

const AUTH = "/auth";

/**
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

export async function requestRegister(
  payload: UserRegisterPayload,
): Promise<UserPublic> {
  const response = await apiClient.post<UserPublic>(
    `${AUTH}/register`,
    payload,
  );
  return response.data;
}

/**
 * Rehidrata el estado de autenticación leyendo el usuario desde el backend.
 *
 * No recibe el token: el navegador lo envía automáticamente vía cookie
 * httpOnly. Si la cookie es válida → 200 con el usuario. Si no → 401.
 */
export async function requestMe(): Promise<UserPublic> {
  const response = await apiClient.get<UserPublic>(`${AUTH}/me`);
  return response.data;
}

/** Le pide al backend que invalide la cookie httpOnly. */
export async function requestLogout(): Promise<void> {
  await apiClient.post(`${AUTH}/logout`);
}
