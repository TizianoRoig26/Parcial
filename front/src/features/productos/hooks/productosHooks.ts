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
  uploadImage,
} from "../services/producto.services";
import { getCategorias } from "../../categoria/services/categoria.services";
import { getIngredientes } from "../../ingredientes/services/ingrediente.services";
import { getUnidadesMedida } from "../../unidadMedida/services/unidadMedida.services";



export type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; producto: IProducto };

export const useProductos = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleClose = () => {
    setModal({ type: "none" });
    setErrorMessage(null);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const LIMIT = 30;

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
    queryFn: () => getIngredientes(0, 100),
    staleTime: 1000 * 60 * 5,
  });

  const { data: unidadesMedida } = useQuery({
    queryKey: ["unidadesMedida"],
    queryFn: getUnidadesMedida,
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
      .filter((p) => (categoriaFiltrada ? p.categorias?.some((c) => c.id === categoriaFiltrada) : true))
      .filter((p) => (nombreFilter ? p.nombre.toLowerCase().includes(nombreFilter.toLowerCase()) : true))
      .sort((a, b) => {
        return a.nombre.localeCompare(b.nombre);
      });
  };

  const handleFilterProductos = (categoria?: number, nombre: string = "") => {
    setCategoriaFiltrada(categoria ?? null);
    setNombreFilter(nombre);
  };

  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
    },
  });

  const handleSubmit = async (
    data: Omit<IProducto, "id" | "categorias" | "ingredientes">,
    categoriaIds: number[],
    ingredienteIds: number[],
    file?: File,
  ) => {
    setErrorMessage(null);
    try {
      let finalImageUrl = data.imagen_url;

      // 1. Si hay un archivo seleccionado, primero lo subimos al servidor
      if (file) {
        finalImageUrl = await uploadImageMutation.mutateAsync(file);
      }

      const updatedData = {
        ...data,
        imagen_url: finalImageUrl,
      };

      if (modal.type === "edit" && modal.producto.id) {
        const prodId = modal.producto.id;
        await editMutation.mutateAsync({ id: prodId, data: updatedData });
        await Promise.all([
          assignCategoriasMutation.mutateAsync({ id: prodId, ids: categoriaIds }),
          assignIngredientesMutation.mutateAsync({ id: prodId, ids: ingredienteIds }),
        ]);
        queryClient.invalidateQueries({ queryKey: ["productos"] });
        handleClose();
      } else {
        const newProd = await createMutation.mutateAsync(updatedData);
        if (newProd.id) {
          await Promise.all([
            assignCategoriasMutation.mutateAsync({ id: newProd.id, ids: categoriaIds }),
            assignIngredientesMutation.mutateAsync({ id: newProd.id, ids: ingredienteIds }),
          ]);
        }
        queryClient.invalidateQueries({ queryKey: ["productos"] });
        handleClose();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Error al guardar el producto";
      setErrorMessage(detail);
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
    unidadesMedida,
    categoriaFiltrada,
    nombreFilter,
    setNombreFilter,
    ordenarProductos,
    handleFilterProductos,
    handleSubmit,
    handleAssignCategorias,
    handleAssignIngredientes,
    changeStateMutation,
    errorMessage,
    setErrorMessage
  };
};
