import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { UserPublic } from "../IUsuario";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  desactivarUsuario,
  activarUsuario,
} from "../services/usuarios.services";

export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; usuario: UserPublic };

export const useUsuarios = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setModal({ type: "none" });
    setErrorMessage(null);
  };

  const { data: usuarios, isLoading, isError } = useQuery({
    queryKey: ["usuarios"],
    queryFn: getUsuarios,
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UserPublic> & { roles?: string[] } }) =>
      updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, disabled }: { id: number; disabled: boolean }) =>
      disabled ? activarUsuario(id) : desactivarUsuario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
    },
  });

  const handleSubmit = (data: any) => {
    setErrorMessage(null);
    if (modal.type === "edit" && modal.usuario.id) {
      const userId = modal.usuario.id;
      updateMutation.mutate(
        { id: userId, data },
        {
          onSuccess: () => {
            handleClose();
          },
          onError: (err: any) => {
            const detail = err.response?.data?.detail || "Error al editar el usuario";
            setErrorMessage(detail);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          handleClose();
        },
        onError: (err: any) => {
          const detail = err.response?.data?.detail || "Error al crear el usuario";
          setErrorMessage(detail);
        },
      });
    }
  };

  return {
    modal,
    setModal,
    handleClose,
    usuarios,
    isLoading,
    isError,
    handleSubmit,
    errorMessage,
    setErrorMessage,
    toggleStatusMutation,
    updateMutation,
    createMutation,
  };
};
