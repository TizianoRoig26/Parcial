import { create } from "zustand";
import * as authApi from "../features/auth/services/auth.services";
import type { UserPublic, UserRegisterPayload, UserRole } from "../features/auth/types";

/**
 * Store de autenticación basado en cookies httpOnly.
 *
 * Diseño (siguiendo el patrón Zustand + cookies httpOnly):
 *  - El JWT NO vive en el frontend. Solo existe como cookie httpOnly
 *    administrada por el navegador y el backend.
 *  - Zustand mantiene únicamente datos no sensibles del usuario en memoria.
 *  - No usamos el middleware `persist` porque no hay nada que persistir
 *    desde JS: al recargar, se rehidrata el estado llamando a `/auth/me`
 *    (la cookie viaja automáticamente).
 */
interface AuthState {
  user: UserPublic | null;
  isAuthenticated: boolean;
  // `isLoading` arranca en true para que la UI sepa que estamos verificando
  // la sesión contra el backend antes de mostrar login o contenido protegido.
  isLoading: boolean;
  error: string | null;

  hasRole: (...roles: UserRole[]) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearSession: () => void;
  setError: (msg: string | null) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setError: (msg) => set({ error: msg }),

  hasRole: (...roles) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },

  clearSession: () =>
    set({ user: null, isAuthenticated: false, isLoading: false, error: null }),

  // Rehidrata el store al iniciar la app. Si la cookie httpOnly sigue
  // siendo válida, el backend devuelve el usuario; si no, queda anónimo.
  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.requestMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.requestLogin(username, password);
      // El backend setea la cookie httpOnly en la respuesta del login.
      // Acto seguido pedimos /me para traer los datos del usuario.
      const user = await authApi.requestMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de inicio de sesión";
      set({ user: null, isAuthenticated: false, isLoading: false, error: msg });
      throw e;
    }
  },

  logout: async () => {
    try {
      await authApi.requestLogout();
    } catch {
      // Aun si falla la red, limpiamos el estado local: el usuario
      // dejará de ver contenido protegido y un eventual 401 posterior
      // terminará de sincronizar la cookie.
    }
    set({ user: null, isAuthenticated: false, error: null, isLoading: false });
  },
}));
