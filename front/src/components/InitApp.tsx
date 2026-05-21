import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

/**
 * InitApp: Componente que inicializa la autenticación
 * Se ejecuta una sola vez cuando la app carga
 */
export function InitApp({ children }: { children: ReactNode }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
