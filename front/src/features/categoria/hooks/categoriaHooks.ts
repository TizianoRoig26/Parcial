import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ICategoria } from "../ICategoria";
import { createCategory, getCategorias, updateCategory, deleteCategory } from "../services/categoria.services";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; categoria: ICategoria }
  | { type: "detail"; categoria: ICategoria };

export const useCategorias = () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleCloseModal();
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: Omit<ICategoria, "id"> }) =>
      updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      handleCloseModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  return {
    modal,
    setModal,
    handleCloseModal,
    handleSubmit,
    categories,
    isLoading,
    isError,
    deleteMutation,
  };
};