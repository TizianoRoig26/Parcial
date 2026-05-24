import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IIngrediente } from "../IIngredientes";
import { getIngredientes, createIngrediente, updateIngrediente, deleteIngrediente } from "../services/ingrediente.services";

export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; ingrediente: IIngrediente };

export const useIngredientes = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleClose = () => setModal({ type: "none" });
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);

  const { data: ingredientes, isLoading, isError } = useQuery({
    queryKey: ["ingredientes", limit],
    queryFn: () => getIngredientes(offset, limit),
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
  const [esAlergenoFilter, setEsAlergenoFilter] = useState<boolean | null>(null);
      const ordenarIngredientes = (productosList: IIngrediente[]) => {
    return productosList
      .filter((p) => (esAlergenoFilter !== null ? p.es_alergeno === esAlergenoFilter : true))
      .sort((a, b) => {
        return a.nombre.localeCompare(b.nombre);
      });
  };

  const handleFilterAlergenos = (esAlergeno?: boolean) => {
    setEsAlergenoFilter(esAlergeno ?? null);
  };

  const handleVerMas = () => {
    setLimit(limit + 10);
    setOffset(offset + 10);
  };

  return {
    modal,
    setModal,
    handleClose,
    ingredientes,
    isLoading,
    isError,
    handleSubmit,
    deleteMutation,
    handleFilterAlergenos,
    ordenarIngredientes,
    handleVerMas
  };
};
