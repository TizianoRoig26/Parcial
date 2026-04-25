import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IProducto } from "../types/IProducto";
import { getProductos, createProducto, updateProducto, deleteProducto, assignCategorias, assignIngredientes } from "../api/producto.services";
import { getCategorias } from "../api/categoria.services";
import { getIngredientes } from "../api/ingrediente.services";
import { ProductoModal } from "../components/Producto/ProductoModal";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; producto: IProducto };

export const ProductsPage = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleClose = () => setModal({ type: "none" });

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ["productos"],
    queryFn: getProductos,
    staleTime: 1000 * 60 * 2,
  });

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productos"] }); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IProducto> }) => updateProducto(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["productos"] }); handleClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProducto,
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

  const handleSubmit = (
    data: Omit<IProducto, "id" | "categorias" | "ingredientes">,
    categoriaIds: number[],
    ingredienteIds: number[],
  ) => {
    if (modal.type === "edit" && modal.producto.id) {
      const prodId = modal.producto.id;
      editMutation.mutate({ id: prodId, data }, {
        onSuccess: () => {
          if (categoriaIds.length) assignCategoriasMutation.mutate({ id: prodId, ids: categoriaIds });
          if (ingredienteIds.length) assignIngredientesMutation.mutate({ id: prodId, ids: ingredienteIds });
          queryClient.invalidateQueries({ queryKey: ["productos"] });
          handleClose();
        },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: (newProd) => {
          if (newProd.id) {
            if (categoriaIds.length) assignCategoriasMutation.mutate({ id: newProd.id, ids: categoriaIds });
            if (ingredienteIds.length) assignIngredientesMutation.mutate({ id: newProd.id, ids: ingredienteIds });
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

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando productos...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar productos</div>;

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Productos</h1>
          <p className="text-black mt-1">Gestiona el catálogo de productos</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 px-5 py-2.5 bg-fern text-black text-sm font-semibold rounded-xl hover:bg-hunter shadow-lg transition-all active:scale-95"
        >
          <span className="text-lg">+</span>
          Nuevo producto
        </button>
      </div>

      <div className="bg-white rounded-md border border-palm/30 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-hunter text-black text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-bold">Producto</th>
              <th className="px-6 py-4 font-bold">Precio</th>
              <th className="px-6 py-4 font-bold text-center">Stock</th>
              <th className="px-6 py-4 font-bold">Categorías</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palm/20">
            {productos?.data?.map((prod) => (
              <tr key={prod.id} className="hover:bg-lime-cream/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {prod.imagen_url && (
                      <img src={prod.imagen_url} alt="" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                    )}
                    <div>
                      <p className="font-semibold text-black">{prod.nombre}</p>
                      <p className="text-xs text-black max-w-[200px] truncate">{prod.descripcion}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-black">${prod.precio_base}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    prod.stock_cantidad > 0 ? "bg-palm/30 text-black" : "bg-red-100 text-red-600"
                  }`}>
                    {prod.stock_cantidad}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {prod.categorias?.length
                      ? prod.categorias.map(c => (
                          <span key={c.id} className="px-2 py-0.5 bg-fern/15 text-black text-xs rounded-full font-medium">
                            {c.nombre}
                          </span>
                        ))
                      : <span className="text-xs text-black">—</span>
                    }
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    prod.is_active ? "bg-palm/30 text-black" : "bg-gray-100 text-gray-500"
                  }`}>
                    {prod.is_active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setModal({ type: "edit", producto: prod })}
                      className="px-3 py-1 text-sm text-black hover:text-black hover:bg-fern rounded-lg transition-colors font-medium"
                    >Editar</button>
                    <button
                      onClick={() => prod.id && deleteMutation.mutate(prod.id)}
                      className="px-3 py-1 text-sm text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors font-medium"
                    >Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!productos?.data || productos.data.length === 0) && (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-black">No hay productos</h3>
            <p className="text-black mt-1">Comienza creando el primer producto.</p>
          </div>
        )}
      </div>

      <ProductoModal
        isOpen={modal.type === "create" || modal.type === "edit"}
        onClose={handleClose}
        onSubmit={handleSubmit}
        productoParaEditar={modal.type === "edit" ? modal.producto : null}
        categoriasDisponibles={categorias?.data ?? []}
        ingredientesDisponibles={ingredientes?.data ?? []}
        onAssignCategorias={handleAssignCategorias}
        onAssignIngredientes={handleAssignIngredientes}
      />
    </div>
  );
};
