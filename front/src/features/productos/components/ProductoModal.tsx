import React, { useState, useEffect, useRef } from "react";
import type { IProducto } from "../IProducto";
import type { ICategoria } from "../../categoria/ICategoria";
import type { IIngrediente } from "../../ingredientes/IIngredientes";
import type { IUnidadMedida } from "../../unidadMedida/IUnidadMedida";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<IProducto, "id" | "categorias" | "ingredientes">, categoriaIds: number[], ingredienteIds: number[], file?: File) => void;
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
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioBase, setPrecioBase] = useState(0);
  const [stockCantidad, setStockCantidad] = useState(0);
  const [imagenUrl, setImagenUrl] = useState("");
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [selectedIngredientes, setSelectedIngredientes] = useState<number[]>([]);
  const [selectedUnidadMedida, setSelectedUnidadMedida] = useState<number>(0);
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setFiles([fileList[0]]);
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
  useEffect(() => {
    if (productoParaEditar) {
      setNombre(productoParaEditar.nombre);
      setDescripcion(productoParaEditar.descripcion);
      setPrecioBase(productoParaEditar.precio_base);
      setSelectedCategorias(productoParaEditar.categorias?.map(c => c.id!) ?? []);
      setSelectedIngredientes(productoParaEditar.ingredientes?.map(i => i.id!) ?? []);
      setSelectedUnidadMedida(productoParaEditar.unidad_medida?.id ?? 0);
    } else {
      setNombre(""); setDescripcion(""); setPrecioBase(0);
      setStockCantidad(0); 
      setSelectedCategorias([]); setSelectedIngredientes([]);
    }
  }, [productoParaEditar, isOpen]);

  if (!isOpen) return null;

  const toggleId = (list: number[], id: number) =>
    list.includes(id) ? list.filter(x => x !== id) : [...list, id];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      { nombre, descripcion, precio_base: precioBase, imagen_url: imagenUrl, unidad_venta_id: selectedUnidadMedida || undefined },
      selectedCategorias,
      selectedIngredientes,
      files[0]
    );
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#E5E4C1] border-1 border-[#0D4012] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="px-8 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-4 pt-5">
            <h2 className="text-black text-xl font-bold">
              {productoParaEditar ? "Editar Producto" : "Nuevo Producto"}
            </h2>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
              <input type="text" required minLength={2} maxLength={100} value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                placeholder="Nombre del producto" />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
              <textarea required minLength={2} maxLength={500} value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
                placeholder="Descripción del producto" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Precio base ($)</label>
                <input type="number" required min={0} value={precioBase} 
                  onChange={e => setPrecioBase(Number(e.target.value))}
                  className="w-50 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm" title="precio"/>
              </div>
              <div className="flex flex-row gap-3 items-center justify-center">
                  <div>
                  <label className=" block text-sm font-semibold text-gray-700 mb-1.5">Medida</label>
                    <select required value={selectedUnidadMedida}
                      onChange={e => setSelectedUnidadMedida(Number(e.target.value))}
                      className="w-25 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm" title="unidad de medida">
                      {unidadesMedidaDisponibles.map(unidad => (
                        <option key={unidad.id} value={unidad.id}>
                          {unidad.simbolo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
            </div>

            {/* Categorías */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categorías</label>
              <div className="custom-scrollbar border border-[#0D4012] bg-[#F4F3CF] rounded-xl overflow-y-auto max-h-20 divide-y divide-gray-100">
                {categoriasDisponibles.length === 0 && (
                  <p className="text-xs text-gray-400 px-4 py-3">No hay categorías disponibles</p>
                )}
                {categoriasDisponibles.map(cat => (
                  <label key={cat.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#E5E4C1] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedCategorias.includes(cat.id!)}
                      onChange={() => setSelectedCategorias(prev => toggleId(prev, cat.id!))}
                      className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                    />
                    <span className="text-sm text-gray-800">{cat.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ingredientes */}
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
                      checked={selectedIngredientes.includes(ing.id!)}
                      onChange={() => setSelectedIngredientes(prev => toggleId(prev, ing.id!))}
                      className="w-4 h-4 rounded accent-[#40A360] cursor-pointer"
                    />
                    <span className="text-sm text-gray-800">
                      {ing.es_alergeno}
                      {ing.nombre}
                    </span>
                  </label>
                ))}
              </div>
            </div>
             <div className="px-6 pt-5">
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
                  ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                  : "border-zinc-700 hover:border-violet-500/60 hover:bg-violet-500/5"
              }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${dragging ? "bg-violet-500/20" : "bg-zinc-800"}`}
            >
              <svg
                className={`w-6 h-6 transition-colors ${dragging ? "text-violet-400" : "text-zinc-500"}`}
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
              <p className="text-sm text-zinc-300">
                <span className="font-semibold text-violet-400">
                  Click to browse
                </span>{" "}
                or drag & drop
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                PNG, JPG, GIF, WEBP · max 10 MB each
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="px-6 mt-4 max-h-48 overflow-y-auto space-y-1.5">
            {files.map((file, i) => (
              <li
                key={i}
                className="flex items-center gap-3 bg-zinc-800/70 hover:bg-zinc-800 rounded-xl px-3 py-2.5 transition-colors group/item"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-9 h-9 object-cover rounded-lg shrink-0 border border-white/5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-zinc-200 truncate font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {file.size < 1024 * 1024
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover/item:opacity-100 shrink-0"
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
