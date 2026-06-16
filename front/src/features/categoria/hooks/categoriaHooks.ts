import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ICategoria } from "../ICategoria";
import { createCategory, getCategorias, updateCategory, deleteCategory } from "../services/categoria.services";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { uploadImage, deleteImagen } from "../../productos/services/producto.services";
import { obtenerId } from "../../../shared/utils/cloudinary";

export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; categoria: ICategoria }
  | { type: "detail"; categoria: ICategoria };

export const useCategorias = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleCloseModal = () => setModal({ type: "none" });

   const uploadImageMutation = useMutation({
      mutationFn: uploadImage,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["productos"] });
      },
    });

  const handleSubmit = async (categoria: ICategoria, file?: File) => {
    try{
      let finalImageUrl = categoria.imagen_url;

      if (file) {
        if (modal.type === "edit" && modal.categoria.imagen_url) {
          const publicId = obtenerId(modal.categoria.imagen_url);
          if (publicId) {
            try {
              await deleteImagen(publicId);
            } catch (err) {
              console.log("No se pudo borrar la imagen anterior", err);
            }
          }
        }
        finalImageUrl = await uploadImageMutation.mutateAsync(file);
      }

      const updatedData = {
        ...categoria,
        imagen_url: finalImageUrl,
      };
    
    if (modal.type === "edit") {
      editMutation.mutate({ id: String(modal.categoria.id), category: updatedData });
    } else {
      createMutation.mutate(updatedData);
    }
  } catch (err: any) {
      const detail = err.response?.data?.detail || "Error al guardar la categoría";
      console.log(detail);
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