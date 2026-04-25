import React, { useState, useEffect } from 'react';
import type { ICategoria } from '../../types/ICategoria';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cat: ICategoria) => void;
  categoriasDisponibles: ICategoria[];
  categoriaParaEditar?: ICategoria | null;
}

export const CategoriaModal = ({ isOpen, onClose, onSubmit, categoriasDisponibles, categoriaParaEditar }: Props) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [parentId, setParentId] = useState('');

  useEffect(() => {
    if (categoriaParaEditar) {
      setNombre(categoriaParaEditar.nombre);
      setDescripcion(categoriaParaEditar.descripcion);
      setImagenUrl(categoriaParaEditar.imagen_url);
      setParentId(categoriaParaEditar.parent_id === null ? '' : String(categoriaParaEditar.parent_id));
    } else {
      setNombre('');
      setDescripcion('');
      setImagenUrl('');
      setParentId('');
    }
  }, [categoriaParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      parent_id: parentId === '' ? null : Number(parentId),
      nombre,
      descripcion,
      imagen_url: imagenUrl,
    }as ICategoria);
  };

  const parentCandidates = categoriasDisponibles.filter((categoria) => categoria.id !== categoriaParaEditar?.id);

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-hunter px-8 py-5">
          <h2 className="text-black text-xl font-bold">
            {categoriaParaEditar ? 'Editar Categoría' : 'Añadir Categoría'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
          <div>
            <label className="block text-brand-cream/60 text-xs uppercase tracking-widest mb-2">Nombre de la categoría</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded p-3 text-brand-cream focus:border-neon-amber outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-brand-cream/60 text-xs uppercase tracking-widest mb-2">Descripción</label>
            <textarea
              required
              minLength={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded p-3 text-brand-cream focus:border-neon-amber outline-none transition-all h-32 resize-none"
            />
          </div>

          <div>
            <label className="block text-brand-cream/60 text-xs uppercase tracking-widest mb-2">Imagen URL</label>
            <input
              type="url"
              required
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded p-3 text-brand-cream focus:border-neon-amber outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-brand-cream/60 text-xs uppercase tracking-widest mb-2">Categoría padre</label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-brand-gray/20 border border-brand-gray/50 rounded p-3 text-brand-cream focus:border-neon-amber outline-none transition-all"
            >
              <option value="">Sin padre</option>
              {parentCandidates.map((categoria) => (
                <option key={categoria.id} value={categoria.id} className="bg-brand-dark">
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
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