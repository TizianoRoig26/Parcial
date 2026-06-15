import React, { useState, useEffect, useRef } from 'react';
import type { ICategoria } from '../ICategoria';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cat: ICategoria, file?: File) => void;
  categoriasDisponibles: ICategoria[];
  categoriaParaEditar?: ICategoria | null;
}

export const CategoriaModal = ({ isOpen, onClose, onSubmit, categoriasDisponibles, categoriaParaEditar }: Props) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [parentId, setParentId] = useState('');
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
    } as ICategoria, files[0]);
  };

  const parentCandidates = categoriasDisponibles.filter((categoria) => categoria.id !== categoriaParaEditar?.id);

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-[#E5E4C1] border-1 border-[#0D4012] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="px-8 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 gap-4 pt-5">
            <h2 className="text-black text-xl font-bold">
              {categoriaParaEditar ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la categoría</label>
              <input
                title='nombreCategoria'
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
              <textarea
                required
                minLength={2}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm h-32 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Imagen de la categoría</label>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-6
                  ${
                    dragging
                      ? "border-[#8C7045] bg-[#F4F3CF]/10 shadow-lg shadow-[#8C7045]/10"
                      : "border-[#8C7045] hover:border-[#8C7045]/60 hover:bg-[#8C7045]/5"
                  }`}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#8C7045]/10">
                  <svg className="w-6 h-6 text-[#8C7045]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-center px-4">
                  <p className="text-xs text-[#8C7045]">
                    <span className="font-semibold text-[#8C7045]">Haz click para buscar</span> o arrastra una imagen
                  </p>
                  <p className="text-[10px] text-[#8C7045] mt-1">
                    PNG, JPG, GIF, WEBP · máx 10 MB
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

            {files.length === 0 && imagenUrl && (
              <div className="mt-2 flex items-center gap-3 bg-[#D5BF86] border border-[#8C7045] rounded-xl px-3 py-2.5">
                <img
                  src={imagenUrl}
                  alt="Categoría actual"
                  className="w-9 h-9 object-cover rounded-lg shrink-0 border border-[#8C7045]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-black uppercase tracking-wider font-semibold">
                    Imagen actual
                  </p>
                </div>
              </div>
            )}

            {/* File list */}
            {files.length > 0 && (
              <ul className="mt-4 max-h-48 overflow-y-auto space-y-1.5">
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
                      <p className="text-sm text-black truncate font-medium">
                        {file.name}
                      </p>
                      <p className="text-xs text-black/60 mt-0.5">
                        {file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-black/60 hover:text-red-600 transition-colors opacity-0 group-hover/item:opacity-100 shrink-0"
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Categoría padre</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full border border-1 border-[#0D4012] focus:bg-[#E5E4C1] bg-[#F4F3CF] rounded-xl px-4 py-2.5 text-sm"
              >
                <option value="">Sin padre</option>
                {parentCandidates.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
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