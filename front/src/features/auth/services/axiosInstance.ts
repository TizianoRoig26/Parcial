import axios, { type AxiosError, type AxiosResponse } from "axios";
import { getApiBase } from "./config";
import { useAuthStore } from "../../../store/authStore";

/**
 * Cliente HTTP usando Axios
 *
 * Características:
 * - Base URL configurada desde .env
 * - Credentials incluidas (cookies httpOnly)
 * - Interceptores para request y response
 * - Manejo automático de errores 401
 */
export const apiClient = axios.create({
  baseURL: getApiBase(),
  withCredentials: true, // Incluye cookies httpOnly
  timeout: 10000, // 10 segundos
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ============================================================
// INTERCEPTOR DE REQUEST
// ============================================================
apiClient.interceptors.request.use(
  (config) => {
    // Puedes agregar lógica aquí si necesitas:
    // - Tokens adicionales (aunque estamos usando httpOnly cookies)
    // - Headers personalizados
    // - Transformar datos antes de enviar
    return config;
  },
  (error: AxiosError) => {
    console.error("Error en request:", error);
    return Promise.reject(error);
  },
);

// ============================================================
// INTERCEPTOR DE RESPONSE
// ============================================================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Respuesta exitosa: pasar normalmente
    return response;
  },
  async (error: AxiosError) => {
    // Manejar errores
    if (error.response?.status === 401) {
      // Token expirado o inválido
      console.warn("Sesión expirada (401), limpiando...");
      useAuthStore.getState().clearSession();
    }

    // Re-lanzar el error para que sea manejado por el llamador
    return Promise.reject(error);
  },
);

// Alias para compatibilidad
export default apiClient;
