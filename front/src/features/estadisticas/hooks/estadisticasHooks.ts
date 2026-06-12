import { useState } from "react";
import type { IProducto } from "../../productos";
import { getProductos } from "../../productos";
import { getCategorias } from "../../categoria";
import { getIngredientes, type IIngrediente } from "../../ingredientes";
import { useQuery } from "@tanstack/react-query";


export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; producto: IProducto };

export const useProductos = () => {
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleClose = () => {
    setModal({ type: "none" });
    setErrorMessage(null);
  };
  const LIMIT = 100;

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ["productos"],
    queryFn: () => getProductos(0, LIMIT),
    staleTime: 1000 * 60 * 2,
  });

  const { data: categorias } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategorias,
    staleTime: 1000 * 60 * 5,
  });

  const { data: ingredientes } = useQuery({
    queryKey: ["ingredientes"],
    queryFn: () => getIngredientes(0, LIMIT),
    staleTime: 1000 * 60 * 5,
  });

  const [nombreFilter, setNombreFilter] = useState<string>("");

  const IngredientesBajoStock = (productosList: IProducto[]) => {
    return productosList
      .filter((i) => i.stock_cantidad < 10)
      .sort((a, b) => {
        return a.stock_cantidad - b.stock_cantidad;
      });
  };

  return {
    modal,
    setModal,
    handleClose,
    productos,
    isLoading,
    isError,
    categorias,
    ingredientes,
    nombreFilter,
    setNombreFilter,
    errorMessage,
    setErrorMessage
  };
};
