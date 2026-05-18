import type { AuthState, IUser } from "../types/index";

const BASE_URL = `${import.meta.env.VITE_API_URL}/auth/v1/token`;

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

export const login = async (
  data: IUser,
): Promise<AuthState> => {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<AuthState>(response);
};