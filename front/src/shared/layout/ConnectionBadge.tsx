import { useWsStore } from "../../store/wsStore";

export function ConnectionBadge() {
  const status = useWsStore((s) => s.status);
  const error = useWsStore((s) => s.error);

  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all duration-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
        </span>
        Conectado
      </span>
    );
  }

  if (status === "connecting") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 shadow-sm transition-all duration-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
        </span>
        Conectando...
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 shadow-sm transition-all duration-300"
      title={error || "Conexión de WebSocket desactivada"}
    >
      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
      Sin conexión
    </span>
  );
}
