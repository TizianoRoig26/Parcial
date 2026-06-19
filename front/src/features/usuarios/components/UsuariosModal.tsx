import React, { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import type { UserPublic } from "../IUsuario";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    username: string;
    full_name: string;
    email: string;
    celular: string;
    password?: string;
    roles: string[];
  }) => void;
  usuarioParaEditar?: UserPublic | null;
  errorMessage?: string | null;
}

const ROLES_DISPONIBLES = [
  { codigo: "PEDIDOS", nombre: "Pedidos" },
  { codigo: "STOCK", nombre: "Stock" },
  { codigo: "CLIENT", nombre: "Cliente" },
  { codigo: "COCINA", nombre: "Cocina" },
];

interface UsuarioFormValues {
  username: string;
  fullName: string;
  email: string;
  celular: string;
  password?: string;
  selectedRoles: string[];
}

export const UsuariosModal = ({
  isOpen,
  onClose,
  onSubmit,
  usuarioParaEditar,
  errorMessage,
}: Props) => {

  const form = useForm<UsuarioFormValues>({
    defaultValues: {
      username: usuarioParaEditar?.username ?? "",
      fullName: usuarioParaEditar?.full_name ?? "",
      email: usuarioParaEditar?.email ?? "",
      celular: usuarioParaEditar?.celular ?? "",
      password: "",
      selectedRoles: usuarioParaEditar?.roles?.map(r => r.codigo.toUpperCase()) ?? [],
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        username: value.username,
        full_name: value.fullName,
        email: value.email,
        celular: value.celular,
        ...(value.password ? { password: value.password } : {}),
        roles: value.selectedRoles,
      });
    },
  });

  // Resetear el formulario cuando cambie el usuario o el estado de apertura
  useEffect(() => {
    if (usuarioParaEditar) {
      form.reset({
        username: usuarioParaEditar.username,
        fullName: usuarioParaEditar.full_name,
        email: usuarioParaEditar.email,
        celular: usuarioParaEditar.celular ?? "",
        password: "",
        selectedRoles: usuarioParaEditar.roles?.map(r => r.codigo.toUpperCase()) ?? [],
      });
    } else {
      form.reset({
        username: "",
        fullName: "",
        email: "",
        celular: "",
        password: "",
        selectedRoles: [],
      });
    }
  }, [usuarioParaEditar, isOpen]);

  if (!isOpen) return null;

  const toggleRol = (currentRoles: string[], codigo: string) =>
    currentRoles.includes(codigo)
      ? currentRoles.filter(x => x !== codigo)
      : [...currentRoles, codigo];

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#E5E4C1] border-1 border-[#0D4012] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="px-8 space-y-4 overflow-y-auto flex-1"
        >
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
              {/* Username */}
              <form.Field
                name="username"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length < 2) return "El username debe tener al menos 2 caracteres";
                    if (value.length > 50) return "El username no puede superar los 50 caracteres";
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div>
                    <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                    <input
                      id={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
                      placeholder="Nombre de usuario"
                      disabled={!!usuarioParaEditar}
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />

              {/* Nombre Completo */}
              <form.Field
                name="fullName"
                validators={{
                  onChange: ({ value }) => {
                    if (!value || value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
                    if (value.length > 100) return "El nombre no puede superar los 100 caracteres";
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div>
                    <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre Completo</label>
                    <input
                      id={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                      placeholder="Nombre completo"
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Email */}
              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) return "El email es requerido";
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) return "El formato de correo electrónico no es válido";
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div>
                    <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                    <input
                      id={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                      placeholder="ejemplo@correo.com"
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />

              {/* Celular */}
              <form.Field
                name="celular"
                validators={{
                  onChange: ({ value }) => {
                    if (value && value.trim().length > 0) {
                      const phoneRegex = /^[0-9+\s-]{6,20}$/;
                      if (!phoneRegex.test(value)) {
                        return "Celular no válido (use números)";
                      }
                    }
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div>
                    <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Celular</label>
                    <input
                      id={field.name}
                      type="text"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                      placeholder="Número de celular"
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {/* Contraseña - Solo si no se está editando */}
            {!usuarioParaEditar && (
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    if (!usuarioParaEditar && (!value || value.length < 8)) {
                      return "La contraseña debe tener al menos 8 caracteres";
                    }
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div>
                    <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Contraseña</label>
                    <input
                      id={field.name}
                      type="password"
                      value={field.state.value || ""}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                      placeholder="Mínimo 8 caracteres"
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />
            )}

            {/* Roles */}
            <form.Field
              name="selectedRoles"
              children={(field) => (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Roles</label>
                  <div className="custom-scrollbar border border-[#0D4012] bg-[#F4F3CF] rounded-xl overflow-y-auto max-h-40 divide-y divide-gray-100">
                    {ROLES_DISPONIBLES.map(rol => (
                      <label key={rol.codigo} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                        <input
                          type="checkbox"
                          checked={field.state.value.includes(rol.codigo)}
                          onChange={() => field.handleChange(toggleRol(field.state.value, rol.codigo))}
                          className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                        />
                        <span className="text-sm text-gray-800">{rol.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            />
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
