import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { IUnidadMedida } from "../IUnidadMedida";
import {
  getUnidadesMedida,
} from "../services/unidadMedida.services";

export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; unidadMedida: IUnidadMedida };

export const useunidadMedida = () => {
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleClose = () => setModal({ type: "none" });

  const { data: unidadMedida, isLoading, isError } = useQuery({
    queryKey: ["unidadesMedida"],
    queryFn: () => getUnidadesMedida(),
    staleTime: 1000 * 60 * 2,
  });

  const [nombreFilter, setNombreFilter] = useState<string>("");

  const ordenarunidadMedida = (unidadMedidaList: IUnidadMedida[]) => {
    return unidadMedidaList
      .filter((p) => (nombreFilter ? p.nombre.toLowerCase().includes(nombreFilter.toLowerCase()) : true))
      .sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return a.nombre.localeCompare(b.nombre);
      });
  };

  const handleFilterunidadMedida = (categoria?: number, nombre: string = "") => {
    setNombreFilter(nombre);
  };


  return {
    modal,
    setModal,
    handleClose,
    unidadMedida,
    isLoading,
    isError,
    nombreFilter,
    setNombreFilter,
    ordenarunidadMedida,
    handleFilterunidadMedida,
  };
};
