import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IProducto } from "../IProducto";
import {
  changeStateProducto,
  getProductos,
  createProducto,
  updateProducto,
  assignCategorias,
  assignIngredientes,
} from "../services/producto.services";
import { getCategorias } from "../../categoria/services/categoria.services";
import { getIngredientes } from "../../ingredientes/services/ingrediente.services";

export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; producto: IProducto };

export const useProductos = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleClose = () => setModal({ type: "none" });
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 20;

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ["productos", currentPage],
    queryFn: () => getProductos((currentPage - 1) * LIMIT, LIMIT),
    staleTime: 1000 * 60 * 2,
  });

  const totalPages = productos?.total ? Math.ceil(productos.total / LIMIT) : 1;

  const { data: categorias } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategorias,
    staleTime: 1000 * 60 * 5,
  });

  const { data: ingredientes } = useQuery({
    queryKey: ["ingredientes"],
    queryFn: getIngredientes,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: createProducto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IProducto> }) => updateProducto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      handleClose();
    },
  });

  const changeStateMutation = useMutation({
    mutationFn: (id: number) => changeStateProducto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  });

  const assignCategoriasMutation = useMutation({
    mutationFn: ({ id, ids }: { id: number; ids: number[] }) => assignCategorias(id, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  });

  const assignIngredientesMutation = useMutation({
    mutationFn: ({ id, ids }: { id: number; ids: number[] }) => assignIngredientes(id, ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  });

  const [categoriaFiltrada, setCategoriaFiltrada] = useState<number | null>(null);
  const [nombreFilter, setNombreFilter] = useState<string>("");

  const ordenarProductos = (productosList: IProducto[]) => {
    return productosList
      .filter((p) => (categoriaFiltrada ? p.categorias.some((c) => c.id === categoriaFiltrada) : true))
      .filter((p) => (nombreFilter ? p.nombre.toLowerCase().includes(nombreFilter.toLowerCase()) : true))
      .sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        return a.nombre.localeCompare(b.nombre);
      });
  };

  const handleFilterProductos = (categoria?: number, nombre: string = "") => {
    setCategoriaFiltrada(categoria ?? null);
    setNombreFilter(nombre);
  };

  const handleSubmit = (
    data: Omit<IProducto, "id" | "categorias" | "ingredientes">,
    categoriaIds: number[],
    ingredienteIds: number[],
  ) => {
    if (modal.type === "edit" && modal.producto.id) {
      const prodId = modal.producto.id;
      editMutation.mutate({ id: prodId, data }, {
        onSuccess: () => {
          assignCategoriasMutation.mutate({ id: prodId, ids: categoriaIds });
          assignIngredientesMutation.mutate({ id: prodId, ids: ingredienteIds });
          queryClient.invalidateQueries({ queryKey: ["productos"] });
          handleClose();
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: (newProd) => {
          if (newProd.id) {
            assignCategoriasMutation.mutate({ id: newProd.id, ids: categoriaIds });
            assignIngredientesMutation.mutate({ id: newProd.id, ids: ingredienteIds });
          }
          queryClient.invalidateQueries({ queryKey: ["productos"] });
          handleClose();
        },
      });
    }
  };

  const handleAssignCategorias = (ids: number[]) => {
    if (modal.type === "edit" && modal.producto.id) {
      assignCategoriasMutation.mutate({ id: modal.producto.id, ids });
    }
  };

  const handleAssignIngredientes = (ids: number[]) => {
    if (modal.type === "edit" && modal.producto.id) {
      assignIngredientesMutation.mutate({ id: modal.producto.id, ids });
    }
  };

  return {
    modal,
    setModal,
    handleClose,
    currentPage,
    setCurrentPage,
    productos,
    isLoading,
    isError,
    totalPages,
    categorias,
    ingredientes,
    categoriaFiltrada,
    nombreFilter,
    setNombreFilter,
    ordenarProductos,
    handleFilterProductos,
    handleSubmit,
    handleAssignCategorias,
    handleAssignIngredientes,
    changeStateMutation,
  };
};
