import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";

interface LoginFormValues {
  username: string;
  password: string;
}

/**
 * Página de Login - Módulo Auth
 */
export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const setError = useAuthStore((s) => s.setError);

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      setError(null);

      try {
        await login(value.username, value.password);
        navigate("/");
      } catch {
        // El error ya está en el store
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Iniciar Sesión</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Usuario */}
        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.trim().length === 0) return "El usuario es requerido";
              return undefined;
            },
          }}
          children={(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-zinc-700">
                Usuario
              </label>
              <input
                id={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={isLoading}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100"
                placeholder="Tu usuario"
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
              )}
            </div>
          )}
        />

        {/* Contraseña */}
        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => {
              if (!value || value.trim().length === 0) return "La contraseña es requerida";
              return undefined;
            },
          }}
          children={(field) => (
            <div>
              <label htmlFor={field.name} className="block text-sm font-medium text-zinc-700">
                Contraseña
              </label>
              <input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={isLoading}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none disabled:bg-zinc-100"
                placeholder="Tu contraseña"
              />
              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
              )}
            </div>
          )}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {isLoading ? "Iniciando sesión…" : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}
