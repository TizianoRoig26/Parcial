import { useAuthStore } from "../../store/authStore";

export function UserHeader() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

  return (
    <header className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:text-left">
      <div>
        <p className="text-sm text-zinc-500">Sesión iniciada</p>
        <p className="text-lg font-semibold text-zinc-900">
          {user.full_name}{" "}
          <span className="text-sm font-normal text-zinc-500">
            (@{user.username})
          </span>
        </p>
        <p className="text-sm text-zinc-500">
          {user.email} · rol{" "}
          <span className="font-medium text-violet-600">{user.role}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
