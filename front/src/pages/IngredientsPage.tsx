import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IIngrediente } from "../types/IIngredientes";
import { getIngredientes, createIngrediente, updateIngrediente, deleteIngrediente } from "../api/ingrediente.services";
import { IngredienteModal } from "../components/Ingrediente/IngredienteModal";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; ingrediente: IIngrediente };

export const IngredientsPage = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleClose = () => setModal({ type: "none" });

  const { data: ingredientes, isLoading, isError } = useQuery({
    queryKey: ["ingredientes"],
    queryFn: getIngredientes,
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: createIngrediente,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ingredientes"] }); handleClose(); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IIngrediente> }) => updateIngrediente(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ingredientes"] }); handleClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIngrediente,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingredientes"] }),
  });

  const handleSubmit = (data: Omit<IIngrediente, "id">) => {
    if (modal.type === "edit" && modal.ingrediente.id) {
      editMutation.mutate({ id: modal.ingrediente.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando ingredientes...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar ingredientes</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Ingredientes</h1>
          <p className="text-black mt-1">Gestiona los ingredientes de tus productos</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 px-5 py-2.5 bg-fern text-black text-sm font-semibold rounded-xl hover:bg-hunter shadow-lg transition-all active:scale-95"
        >
          <span className="text-lg">+</span>
          Nuevo ingrediente
        </button>
      </div>

      <div className="bg-white rounded-md border border-palm/30 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-hunter text-black text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">Nombre</th>
              <th className="px-6 py-4 font-bold">Descripción</th>
              <th className="px-6 py-4 font-bold text-center">Alérgeno</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palm/20">
            {ingredientes?.data?.map((ing) => (
              <tr key={ing.id} className="hover:bg-lime-cream/20 transition-colors">
                <td className="px-6 py-4 font-medium text-black">{ing.nombre}</td>
                <td className="px-6 py-4 text-black text-sm max-w-xs truncate">{ing.descripcion || "—"}</td>
                <td className="px-6 py-4 text-center">
                  {ing.es_alergeno
                    ? <span>Sí</span>
                    : <span>No</span>
                  }
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    ing.is_active ? "bg-palm/30 text-black" : "bg-gray-100 text-gray-500"
                  }`}>
                    {ing.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setModal({ type: "edit", ingrediente: ing })}
                      className="px-3 py-1 text-sm text-black hover:text-black hover:bg-fern rounded-lg transition-colors font-medium"
                    >Editar</button>
                    <button
                      onClick={() => ing.id && deleteMutation.mutate(ing.id)}
                      className="px-3 py-1 text-sm text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors font-medium"
                    >Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!ingredientes?.data || ingredientes.data.length === 0) && (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-black">No hay ingredientes</h3>
            <p className="text-black mt-1">Comienza creando el primer ingrediente.</p>
          </div>
        )}
      </div>

      <IngredienteModal
        isOpen={modal.type === "create" || modal.type === "edit"}
        onClose={handleClose}
        onSubmit={handleSubmit}
        ingredienteParaEditar={modal.type === "edit" ? modal.ingrediente : null}
      />
    </div>
  );
};
