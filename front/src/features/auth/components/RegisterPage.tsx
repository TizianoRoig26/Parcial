import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { useState } from "react";
import type { UserRegisterPayload } from "../types/index";

/**
 * Página de Registro - Módulo Auth
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const setError = useAuthStore((s) => s.setError);

  const [formData, setFormData] = useState<UserRegisterPayload>({
    username: "",
    full_name: "",
    password: "",
    email: "",
  });
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== passwordConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      navigate("/");
    } catch {

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 ">
      <h1 className="text-3xl font-bold">Registrarse</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Usuario
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100"
            placeholder="Tu usuario"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100"
            placeholder="Tu contraseña"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Confirmar Contraseña
          </label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            disabled={isLoading}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100"
            placeholder="Confirmar contraseña"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isLoading ? "Registrando…" : "Registrarse"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600">
        ¿Ya tienes cuenta?{" "}
        <button
          onClick={() => navigate("/login")}
          className="font-medium text-zinc-900 hover:underline"
        >
          Iniciar Sesión
        </button>
      </p>
    </div>
  );
}
