import React, { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import type { IIngrediente } from "../IIngredientes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<IIngrediente, "id">) => void;
  ingredienteParaEditar?: IIngrediente | null;
  errorMessage?: string | null;
}

interface IngredienteFormValues {
  nombre: string;
  descripcion: string;
  stock: number;
  esAlergeno: boolean;
}

export const IngredienteModal = ({ isOpen, onClose, onSubmit, ingredienteParaEditar, errorMessage }: Props) => {
  
  const form = useForm<IngredienteFormValues>({
    defaultValues: {
      nombre: ingredienteParaEditar?.nombre ?? "",
      descripcion: ingredienteParaEditar?.descripcion ?? "",
      stock: ingredienteParaEditar?.stock_cantidad ?? 0,
      esAlergeno: ingredienteParaEditar?.es_alergeno ?? false,
    },
    onSubmit: async ({ value }) => {
      onSubmit({
        nombre: value.nombre,
        descripcion: value.descripcion,
        es_alergeno: value.esAlergeno,
        stock_cantidad: value.stock,
      });
    },
  });

  useEffect(() => {
    if (ingredienteParaEditar) {
      form.reset({
        nombre: ingredienteParaEditar.nombre,
        descripcion: ingredienteParaEditar.descripcion,
        stock: ingredienteParaEditar.stock_cantidad ?? 0,
        esAlergeno: ingredienteParaEditar.es_alergeno,
      });
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        stock: 0,
        esAlergeno: false,
      });
    }
  }, [ingredienteParaEditar, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#E5E4C1] border-1 border-[#0D4012] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
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
              {ingredienteParaEditar ? "Editar Ingrediente" : "Nuevo Ingrediente"}
            </h2>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Nombre */}
            <form.Field
              name="nombre"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
                  if (value.length > 100) return "El nombre no puede superar los 100 caracteres";
                  return undefined;
                },
              }}
              children={(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Nombre del ingrediente"
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            />

            {/* Descripción */}
            <form.Field
              name="descripcion"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length < 2) return "La descripción debe tener al menos 2 caracteres";
                  if (value.length > 500) return "La descripción no puede superar los 500 caracteres";
                  return undefined;
                },
              }}
              children={(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
                  <textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm h-28 resize-none"
                    placeholder="Descripción del ingrediente"
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            />
            
            {/* Stock */}
            <form.Field
              name="stock"
              validators={{
                onChange: ({ value }) => {
                  if (value < 0) return "El stock no puede ser negativo";
                  return undefined;
                },
              }}
              children={(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Stock</label>
                  <input 
                    id={field.name}
                    type="number" 
                    min={0} 
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={e => field.handleChange(Number(e.target.value))}
                    className="w-25 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm" 
                    title="stock"
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            />

            {/* Es alérgeno */}
            <form.Field
              name="esAlergeno"
              children={(field) => (
                <div className="border border-[#0D4012] bg-[#F4F3CF] rounded-xl divide-y divide-gray-100 overflow-hidden">
                  <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                    <input
                      type="checkbox"
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={() => field.handleChange(!field.state.value)}
                      className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                    />
                    <span className="text-sm text-gray-800">
                      Es alérgeno
                    </span>
                  </label>
                </div>
              )}
            />
          </div>

          <div className="flex justify-end gap-3 py-4">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-black bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit"
              className="px-6 py-2 bg-[#47AA66] text-black font-semibold rounded-xl shadow-lg">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
