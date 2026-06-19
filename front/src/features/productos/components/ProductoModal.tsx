import React, { useState, useEffect, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import type { IProducto } from "../IProducto";
import type { ICategoria } from "../../categoria/ICategoria";
import type { IIngrediente } from "../../ingredientes/IIngredientes";
import type { IUnidadMedida } from "../../unidadMedida/IUnidadMedida";

export interface IngredienteSeleccionado {
  id: number;
  es_removible: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<IProducto, "id" | "categorias" | "ingredientes">, categoriaIds: number[], ingredientes: IngredienteSeleccionado[], files?: File[]) => void;
  productoParaEditar?: IProducto | null;
  categoriasDisponibles: ICategoria[];
  ingredientesDisponibles: IIngrediente[];
  unidadesMedidaDisponibles: IUnidadMedida[];
  onAssignCategorias?: (ids: number[]) => void;
  onAssignIngredientes?: (ids: number[]) => void;
  errorMessage?: string | null;
}

export const ProductoModal = ({
  isOpen,
  onClose,
  onSubmit,
  productoParaEditar,
  categoriasDisponibles,
  ingredientesDisponibles,
  unidadesMedidaDisponibles,
  onAssignCategorias,
  onAssignIngredientes,
  errorMessage,
}: Props) => {
  // --- Estado local para archivos (fuera del form porque File no es serializable) ---
  const [files, setFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Valores por defecto calculados ---
  const defaultUnidad = productoParaEditar?.unidad_medida?.id
    ?? productoParaEditar?.unidad_venta_id
    ?? (unidadesMedidaDisponibles[0]?.id ?? 0);

  // --- TanStack Form: hook principal ---
  const form = useForm<ProductoFormValues>({
    defaultValues: {
      nombre: productoParaEditar?.nombre ?? "",
      descripcion: productoParaEditar?.descripcion ?? "",
      precioBase: productoParaEditar?.precio_base ?? 0,
      selectedUnidadMedida: defaultUnidad,
      selectedCategorias: productoParaEditar?.categorias?.map(c => c.id!) ?? [],
      selectedIngredientes: productoParaEditar?.ingredientes?.map(i => ({ id: i.id!, es_removible: false })) ?? [],
    },
    onSubmit: async ({ value }) => {
      onSubmit(
        {
          nombre: value.nombre,
          descripcion: value.descripcion,
          precio_base: value.precioBase,
          imagen_url: existingUrls,
          unidad_venta_id: value.selectedUnidadMedida || undefined,
        },
        value.selectedCategorias,
        value.selectedIngredientes,
        files,
      );
    },
  });

  // --- Reset del formulario cuando cambia el producto o se abre/cierra el modal ---
  useEffect(() => {
    if (productoParaEditar) {
      form.reset({
        nombre: productoParaEditar.nombre,
        descripcion: productoParaEditar.descripcion,
        precioBase: productoParaEditar.precio_base,
        selectedUnidadMedida: productoParaEditar.unidad_medida?.id ?? productoParaEditar.unidad_venta_id ?? (unidadesMedidaDisponibles[0]?.id ?? 0),
        selectedCategorias: productoParaEditar.categorias?.map(c => c.id!) ?? [],
        selectedIngredientes: productoParaEditar.ingredientes?.map(i => ({ id: i.id!, es_removible: false })) ?? [],
      });
      setExistingUrls(productoParaEditar.imagen_url ?? []);
    } else {
      form.reset({
        nombre: "",
        descripcion: "",
        precioBase: 0,
        selectedUnidadMedida: unidadesMedidaDisponibles[0]?.id ?? 0,
        selectedCategorias: [],
        selectedIngredientes: [],
      });
      setExistingUrls([]);
    }
    setFiles([]);
  }, [productoParaEditar, isOpen]);

  // --- Sincronizar unidad de medida si carga despues ---
  useEffect(() => {
    const currentUnidad = form.getFieldValue("selectedUnidadMedida");
    if (currentUnidad === 0 && unidadesMedidaDisponibles.length > 0) {
      form.setFieldValue("selectedUnidadMedida",
        productoParaEditar?.unidad_medida?.id
        ?? productoParaEditar?.unidad_venta_id
        ?? unidadesMedidaDisponibles[0].id
        ?? 0
      );
    }
  }, [unidadesMedidaDisponibles, productoParaEditar]);

  if (!isOpen) return null;

  // --- Helpers para archivos (fuera del form) ---
  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingUrl = (index: number) => {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Helpers para toggles de categorias e ingredientes ---
  const toggleCategoriaId = (list: number[], id: number) =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id];

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
              {productoParaEditar ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
                {errorMessage}
              </div>
            )}

            {/* --- Campo: Nombre --- */}
            <form.Field
              name="nombre"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres";
                  if (value.length > 100) return "El nombre no puede superar 100 caracteres";
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
                    placeholder="Nombre del producto"
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            />

            {/* --- Campo: Descripcion --- */}
            <form.Field
              name="descripcion"
              validators={{
                onChange: ({ value }) => {
                  if (!value || value.trim().length < 2) return "La descripcion debe tener al menos 2 caracteres";
                  if (value.length > 500) return "La descripcion no puede superar 500 caracteres";
                  return undefined;
                },
              }}
              children={(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Descripcion</label>
                  <textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                    placeholder="Descripcion del producto"
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                  )}
                </div>
              )}
            />

            {/* --- Fila: Precio + Unidad de Medida --- */}
            <div className="grid grid-cols-2 gap-4">
              {/* Campo: Precio base */}
              <form.Field
                name="precioBase"
                validators={{
                  onChange: ({ value }) => {
                    if (value < 0) return "El precio no puede ser negativo";
                    return undefined;
                  },
                }}
                children={(field) => (
                  <div>
                    <label htmlFor={field.name} className="block text-sm font-semibold text-gray-700 mb-1.5">Precio base ($)</label>
                    <input
                      id={field.name}
                      type="number"
                      min={0}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                      className="w-50 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                      title="precio"
                    />
                    {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                      <p className="text-red-600 text-xs mt-1 font-medium">{field.state.meta.errors.join(", ")}</p>
                    )}
                  </div>
                )}
              />

              {/* Campo: Unidad de Medida */}
              <form.Field
                name="selectedUnidadMedida"
                children={(field) => (
                  <div className="flex flex-row gap-3 items-center justify-center">
                    <div>
                      <label htmlFor={field.name} className=" block text-sm font-semibold text-gray-700 mb-1.5">Medida</label>
                      <select
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        className="w-25 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                        title="unidad de medida"
                      >
                        {unidadesMedidaDisponibles.map(unidad => (
                          <option key={unidad.id} value={unidad.id}>
                            {unidad.simbolo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* --- Categorias (field de array) --- */}
            <form.Field
              name="selectedCategorias"
              children={(field) => (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Categorias</label>
                  <div className="custom-scrollbar border border-[#0D4012] bg-[#F4F3CF] rounded-xl overflow-y-auto max-h-20 divide-y divide-gray-100">
                    {categoriasDisponibles.length === 0 && (
                      <p className="text-xs text-gray-400 px-4 py-3">No hay categorias disponibles</p>
                    )}
                    {categoriasDisponibles.map(cat => (
                      <label key={cat.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                        <input
                          type="checkbox"
                          checked={field.state.value.includes(cat.id!)}
                          onChange={() => field.handleChange(toggleCategoriaId(field.state.value, cat.id!))}
                          className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                        />
                        <span className="text-sm text-gray-800">{cat.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            />

            {/* --- Ingredientes (field de array de objetos) --- */}
            <form.Field
              name="selectedIngredientes"
              children={(field) => {
                const toggleIngrediente = (id: number) => {
                  const current = field.state.value;
                  const exists = current.find(x => x.id === id);
                  if (exists) {
                    field.handleChange(current.filter(x => x.id !== id));
                  } else {
                    field.handleChange([...current, { id, es_removible: false }]);
                  }
                };

                const toggleRemovible = (id: number) => {
                  field.handleChange(
                    field.state.value.map(x =>
                      x.id === id ? { ...x, es_removible: !x.es_removible } : x
                    )
                  );
                };

                return (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ingredientes</label>
                    <div className="custom-scrollbar border border-[#0D4012] bg-[#F4F3CF] rounded-xl overflow-y-auto max-h-20 divide-y divide-gray-100">
                      {ingredientesDisponibles.length === 0 && (
                        <p className="text-xs text-gray-400 px-4 py-3">No hay ingredientes disponibles</p>
                      )}
                      {ingredientesDisponibles.map(ing => (
                        <label key={ing.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                          <input
                            type="checkbox"
                            checked={field.state.value.some(x => x.id === ing.id!)}
                            onChange={() => toggleIngrediente(ing.id!)}
                            className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                          />
                          <span className="text-sm text-gray-800">
                            {ing.nombre}
                            {ing.es_alergeno && <span className="text-red-500 font-bold text-xs mr-1"> Alergeno</span>}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Pills de ingredientes seleccionados */}
                    {field.state.value.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {field.state.value.map(sel => {
                          const ing = ingredientesDisponibles.find(i => i.id === sel.id);
                          if (!ing) return null;
                          return (
                            <div
                              key={sel.id}
                              className="flex items-center gap-1.5 bg-[#D5BF86] border border-[#8C7045] rounded-full px-3 py-1 text-xs font-semibold text-gray-800 transition-all hover:shadow-md"
                            >
                              <span>{ing.nombre}</span>
                              <button
                                type="button"
                                onClick={() => toggleRemovible(sel.id)}
                                title={sel.es_removible ? "Marcado como removible" : "Marcado como no removible"}
                                className={`flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
                                  sel.es_removible
                                    ? "bg-[#47AA66] border-[#0D4012] text-white"
                                    : "bg-[#F4F3CF] border-[#8C7045] text-gray-400"
                                }`}
                              >
                                {sel.es_removible && (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleIngrediente(sel.id)}
                                className="ml-0.5 text-gray-500 hover:text-red-600 transition-colors"
                                title="Quitar ingrediente"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                        <p className="w-full text-[11px] text-gray-500 mt-1 italic">
                          El check verde indica que el cliente puede quitar el ingrediente al pedir.
                        </p>
                      </div>
                    )}
                  </div>
                );
              }}
            />


             <div className="px-6 pt-5">
          {/* Imagenes existentes */}
          {existingUrls.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Imagenes actuales</label>
              <div className="flex flex-wrap gap-2">
                {existingUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Imagen ${i + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-[#8C7045]"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingUrl(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Quitar imagen"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-11
              ${
                dragging
                  ? "border-[#8C7045] bg-[#F4F3CF]/10 shadow-lg shadow-[#8C7045]/10"
                  : "border-[#8C7045] hover:border-[#8C7045]/60 hover:bg-[#8C7045]/5"
              }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? "bg-[#8C7045]/20" : "bg-[#8C7045]/5"}`}
            >
              <svg
                className={`w-6 h-6 transition-colors ${dragging ? "text-[#8C7045]" : "text-[#8C7045]"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#8C7045]">
                <span className="font-semibold text-[#8C7045]">
                  Click para seleccionar
                </span>{" "}
                o arrastra y solta
              </p>
              <p className="text-xs text-[#8C7045] mt-1">
                PNG, JPG, GIF, WEBP · max 10 MB · multiples imagenes
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Nuevos archivos por subir */}
        {files.length > 0 && (
          <ul className="px-6 mt-4 max-h-48 overflow-y-auto space-y-1.5">
            {files.map((file, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-[#D5BF86] hover:bg-[#BEA972] rounded-xl px-3 py-2.5 transition-colors group/item"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-9 h-9 object-cover rounded-lg shrink-0 border border-[#8C7045]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 truncate font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100 shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
             </div>

          <div className="flex justify-end gap-3 py-4">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-black bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit" key="guardar"
              className="px-6 py-2 bg-[#47AA66] text-black font-semibold rounded-xl shadow-lg">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
