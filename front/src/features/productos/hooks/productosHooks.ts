import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IProducto } from "../IProducto";
import type { IngredienteSeleccionado } from "../components/ProductoModal";
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
  const LIMIT = 20;

  const [categoriaFiltrada, setCategoriaFiltrada] = useState<number | null>(null);
  const [nombreFilter, setNombreFilter] = useState<string>("");

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ["productos", currentPage, categoriaFiltrada, nombreFilter],
    queryFn: () => getProductos((currentPage - 1) * LIMIT, LIMIT, nombreFilter || undefined, categoriaFiltrada || undefined),
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
    mutationFn: ({ id, ingredientes }: { id: number; ingredientes: IngredienteSeleccionado[] }) =>
      assignIngredientes(id, ingredientes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["productos"] }),
  });

  const paginatedProductos = productos?.data || [];
  const filteredCount = productos?.total ?? 0;

  const handleFilterProductos = (categoria?: number, nombre: string = "") => {
    setCategoriaFiltrada(categoria ?? null);
    setNombreFilter(nombre);
    setCurrentPage(1);
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
    ingredientes: IngredienteSeleccionado[],
    files?: File[],
  ) => {
    setErrorMessage(null);
    try {
      // data.imagen_url ya contiene las URLs existentes que el usuario quiso conservar
      let finalImageUrls: string[] = [...(data.imagen_url ?? [])];

      // Subir los archivos nuevos uno a uno
      if (files && files.length > 0) {
        for (const file of files) {
          const url = await uploadImageMutation.mutateAsync(file);
          finalImageUrls.push(url);
        }
      }

      const updatedData = {
        ...data,
        imagen_url: finalImageUrls,
      };

      if (modal.type === "edit" && modal.producto.id) {
        const prodId = modal.producto.id;
        await editMutation.mutateAsync({ id: prodId, data: updatedData });
        await Promise.all([
          assignCategoriasMutation.mutateAsync({ id: prodId, ids: categoriaIds }),
          assignIngredientesMutation.mutateAsync({ id: prodId, ingredientes }),
        ]);
        queryClient.invalidateQueries({ queryKey: ["productos"] });
        handleClose();
      } else {
        const newProd = await createMutation.mutateAsync(updatedData);
        if (newProd.id) {
          await Promise.all([
            assignCategoriasMutation.mutateAsync({ id: newProd.id, ids: categoriaIds }),
            assignIngredientesMutation.mutateAsync({ id: newProd.id, ingredientes }),
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

  const handleAssignIngredientes = (ingredientes: IngredienteSeleccionado[]) => {
    if (modal.type === "edit" && modal.producto.id) {
      assignIngredientesMutation.mutate({ id: modal.producto.id, ingredientes });
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
    paginatedProductos,
    filteredCount,
    handleFilterProductos,
    handleSubmit,
    handleAssignCategorias,
    handleAssignIngredientes,
    changeStateMutation,
    errorMessage,
    setErrorMessage
  };
};
