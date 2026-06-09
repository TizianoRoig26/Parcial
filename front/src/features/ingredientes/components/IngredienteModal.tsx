import React, { useState, useEffect } from "react";
import type { IIngrediente } from "../IIngredientes";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<IIngrediente, "id">) => void;
  ingredienteParaEditar?: IIngrediente | null;
  errorMessage?: string | null;
}

export const IngredienteModal = ({ isOpen, onClose, onSubmit, ingredienteParaEditar, errorMessage }: Props) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esAlergeno, setEsAlergeno] = useState(false);
  const [stock, setStock] = useState(0);


  useEffect(() => {
    if (ingredienteParaEditar) {
      setNombre(ingredienteParaEditar.nombre);
      setDescripcion(ingredienteParaEditar.descripcion);
      setEsAlergeno(ingredienteParaEditar.es_alergeno);
      setStock(ingredienteParaEditar.stock_cantidad ?? 0);
    } else {
      setNombre("");
      setDescripcion("");
      setEsAlergeno(false);
      setStock(0);
    }
  }, [ingredienteParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ nombre, descripcion, es_alergeno: esAlergeno, stock_cantidad: stock });
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-hunter px-8 py-5">
          <h2 className="text-black text-xl font-bold">
            {ingredienteParaEditar ? "Editar Ingrediente" : "Nuevo Ingrediente"}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
        {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2.5 rounded-xl text-sm font-semibold">
                {errorMessage}
              </div>
            )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              placeholder="Nombre del ingrediente"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
            <textarea
              required
              minLength={2}
              maxLength={500}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition h-28 resize-none"
              placeholder="Descripción del ingrediente"
            />
          </div>
          
          <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stock</label>
          <input type="number" required min={0} value={stock}
            onChange={e => setStock(Number(e.target.value))}
            className="w-25 border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm" title="stock"/>
          </div>

          <div className="border border-gray-200 rounded-xl divide-y divide-gray-100">
            <label className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={esAlergeno}
                onChange={() => setEsAlergeno(!esAlergeno)}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-800">
                {esAlergeno}
                Es alérgeno
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-black bg-gray-100 rounded-xl hover:bg-gray-200 transition">
              Cancelar
            </button>
            <button type="submit"
              className="px-6 py-2 text-sm font-semibold text-black bg-fern rounded-xl hover:bg-hunter transition shadow-lg">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
