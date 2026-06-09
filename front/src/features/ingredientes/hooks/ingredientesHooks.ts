import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IIngrediente } from "../IIngredientes";
import { getIngredientes, createIngrediente, updateIngrediente, deleteIngrediente, cambiostock } from "../services/ingrediente.services";

export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; ingrediente: IIngrediente };

export const useIngredientes = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleClose = () => {
    setModal({ type: "none" });
    setErrorMessage(null);
  };
  const [limit, setLimit] = useState(10);

  const { data: ingredientes, isLoading, isError } = useQuery({
    queryKey: ["ingredientes", limit],
    queryFn: () => getIngredientes(0, limit),
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

  const stockMutation = useMutation({
    mutationFn: ( {id, cantidad}: {id: number, cantidad: number} ) => cambiostock(id, cantidad),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ingredientes"] }),
  });

  const handleSubmit = (data: Omit<IIngrediente, "id">) => {
    setErrorMessage(null);
    if (modal.type === "edit" && modal.ingrediente.id) {
      editMutation.mutate({ id: modal.ingrediente.id, data }, {
        onError: (err: any) => {
          const detail = err.response?.data?.detail || "Error al editar el ingrediente";
          setErrorMessage(detail);
        }
      });
    } else {
      createMutation.mutate(data, {
        onError: (err: any) => {
          const detail = err.response?.data?.detail || "Error al crear el ingrediente";
          setErrorMessage(detail);
        }
      });
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
    setLimit(prev => prev + 10);
  };

  const handleCambioStock = async (id: number, cantidad: number) => {
    stockMutation.mutate({ id, cantidad });
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
    handleVerMas,
    handleCambioStock,
    errorMessage
  };
};
