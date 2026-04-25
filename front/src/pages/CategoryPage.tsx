import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { ICategoria } from "../types/ICategoria";
import { createCategory, getCategorias, updateCategory, deleteCategory } from "../api/categoria.services";
import { CategoriaModal } from "../components/Categoria/CategoriaModal";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; categoria: ICategoria }
  | { type: "detail"; categoria: ICategoria };

export const CategoryPage = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleCloseModal = () => setModal({ type: "none" });

  const handleSubmit = (categoria: ICategoria) => {
    if (modal.type === "edit") {
      editMutation.mutate({ id: String(modal.categoria.id), category: categoria });
    } else {
      createMutation.mutate(categoria);
    }
  };

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategorias,
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); handleCloseModal(); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: Omit<ICategoria, "id"> }) => updateCategory(id, category),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); handleCloseModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando categorías...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar categorías</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Categorías</h1>
          <p className="text-black mt-1">Gestiona las clasificaciones de tus productos</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 px-5 py-2.5 bg-fern text-black text-sm font-semibold rounded-xl hover:bg-hunter shadow-lg transition-all active:scale-95"
        >
          <span className="text-lg">+</span>
          Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-md border border-palm/30 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-hunter text-black text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">Nombre</th>
              <th className="px-6 py-4 font-bold">Descripción</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palm/20">
            {(categories as { data?: ICategoria[] }).data?.map((cat) => (
              <tr key={cat.id} className="hover:bg-lime-cream/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {cat.imagen_url && (
                      <img src={cat.imagen_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    )}
                    <span className="font-medium text-black">{cat.nombre}</span>
                    {cat.parent_id && (
                      <span className="text-xs text-black">
                        (Padre: {(categories as { data?: ICategoria[] }).data?.find(c => c.id === cat.parent_id)?.nombre || "..."})
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-black text-sm max-w-xs truncate">{cat.descripcion || "—"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    cat.is_active ? "bg-palm/30 text-black" : "bg-gray-100 text-gray-500"
                  }`}>
                    {cat.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setModal({ type: "edit", categoria: cat })}
                      className="px-3 py-1 text-sm text-black hover:text-black hover:bg-fern rounded-lg transition-colors font-medium"
                    >Editar</button>
                    <button
                      onClick={() => cat.id && deleteMutation.mutate(cat.id)}
                      className="px-3 py-1 text-sm text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors font-medium"
                    >Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!(categories as { data?: ICategoria[] }).data || (categories as { data?: ICategoria[] }).data!.length === 0) && (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-black">No hay categorías</h3>
            <p className="text-black mt-1">Comienza creando una nueva categoría.</p>
          </div>
        )}
      </div>

      <CategoriaModal
        isOpen={modal.type === "create" || modal.type === "edit"}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        categoriasDisponibles={(categories as { data?: ICategoria[] }).data || []}
        categoriaParaEditar={modal.type === "edit" ? modal.categoria : null}
      />
    </div>
  );
};
