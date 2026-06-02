import React, { useState, useEffect } from "react";
import type { UserPublic } from "../IUsuario";

const ROLES = [
  { codigo: "ADMIN", nombre: "Administrador" },
  { codigo: "PEDIDOS", nombre: "Pedidos" },
  { codigo: "STOCK", nombre: "Stock" },
  { codigo: "CLIENT", nombre: "Cliente" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    username: string;
    full_name: string;
    email: string;
    password?: string;
    roles: string[];
  }) => void;
  usuarioParaEditar?: UserPublic | null;
  errorMessage?: string | null;
}

const ROLES_DISPONIBLES = [
  { codigo: "ADMIN", nombre: "Administrador" },
  { codigo: "PEDIDOS", nombre: "Pedidos" },
  { codigo: "STOCK", nombre: "Stock" },
  { codigo: "CLIENT", nombre: "Cliente" },
];

export const UsuariosModal = ({
  isOpen,
  onClose,
  onSubmit,
  usuarioParaEditar,
  errorMessage,
}: Props) => {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (usuarioParaEditar) {
      setUsername(usuarioParaEditar.username);
      setFullName(usuarioParaEditar.full_name);
      setEmail(usuarioParaEditar.email);
      setPassword("");
      setSelectedRoles(usuarioParaEditar.roles?.map(r => r.codigo.toUpperCase()) ?? []);
    } else {
      setUsername("");
      setFullName("");
      setEmail("");
      setPassword("");
      setSelectedRoles([]);
    }
  }, [usuarioParaEditar, isOpen]);

  if (!isOpen) return null;

  const toggleRol = (codigo: string) => {
    setSelectedRoles(prev =>
      prev.includes(codigo) ? prev.filter(x => x !== codigo) : [...prev, codigo]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username,
      full_name: fullName,
      email,
      ...(password ? { password } : {}),
      roles: selectedRoles,
    });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#E5E4C1] border-1 border-[#0D4012] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="px-8 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-4 pt-5">
            <h2 className="text-black text-xl font-bold">
              {usuarioParaEditar ? "Editar Usuario" : "Nuevo Usuario"}
            </h2>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
                {errorMessage}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Nombre de usuario"
                  disabled={!!usuarioParaEditar}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Nombre completo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                placeholder="ejemplo@correo.com"
              />
            </div>

            {!usuarioParaEditar && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required={!usuarioParaEditar}
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            )}

            {/* Roles */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Roles</label>
              <div className="custom-scrollbar border border-[#0D4012] bg-[#F4F3CF] rounded-xl overflow-y-auto max-h-40 divide-y divide-gray-100">
                {ROLES_DISPONIBLES.map(rol => (
                  <label key={rol.codigo} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(rol.codigo)}
                      onChange={() => toggleRol(rol.codigo)}
                      className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                    />
                    <span className="text-sm text-gray-800">{rol.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 py-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-black bg-gray-100 rounded-xl hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#47AA66] text-black font-semibold rounded-xl shadow-lg"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
