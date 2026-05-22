import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { IProducto } from "../IProducto";
import { getProductos, createProducto, updateProducto, deleteProducto, assignCategorias, assignIngredientes } from "../services/producto.services";
import { getCategorias } from "../../categoria/services/categoria.services";
import { getIngredientes } from "../../ingredientes/services/ingrediente.services";
import { ProductoModal } from "../components/ProductoModal";

type ModalState =
  | { type: "none" }
  | { type: "create" }
  | { type: "edit"; producto: IProducto };

export const ProductsPage = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const handleClose = () => setModal({ type: "none" });
  
  const [hasta, setHasta] = useState(10);
  
  const handleVerMas = () => {
    setHasta((prev) => prev + 10);
  };

  const { data: productos, isLoading, isError } = useQuery({
    queryKey: ["productos", hasta],
    queryFn: () => getProductos(0, hasta),
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
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Productos</h1>
          <p className="text-black mt-1">Gestiona el catálogo de productos</p>
        </div>
        
      </div>
      <div className="flex flex-row justify-between pb-4">
        <ul>
          <li>
            <div className="flex flex-wrap gap-1 pt-2.5">
              {categorias?.data?.length
                ? categorias.data.map(c => (
                  <span key={c.id} className="px-3 py-1.5 bg-fern/15 text-black text-xs rounded-full font-medium">
                    {c.nombre}
                  </span>
                ))
                : <span className="text-xs text-black">—</span>
              }
            </div>
          </li>
        </ul>
        <button
          onClick={() => setModal({ type: "create" })}
          className=" bg-[#47AA66] text-black font-semibold shadow-md rounded-full px-3 pb-1 hover:bg-[#699D64] transition-colors duration-300"
        >
          <span className="text-lg">+</span>
          Nuevo producto
        </button>
      </div>

      <div className="flex-1 rounded-3xl border border-[#0D4012] overflow-y-auto min-h-0 shadow-lg custom-scrollbar">
        <table className="w-full text-left table-fixed shadow-lg">
          <thead className="border-[#0D4012]">
            <tr className=" sticky top-0 z-10 bg-[#E5E4C1] font-normal text-[#0D4012] text-xs uppercase tracking-wider">
              <th className="p-3 ">Img</th>
              <th className="p-3">Producto</th>
              <th className="p-3">Categorías</th>
              <th className="p-3">Precio</th>
              <th className="text-center p-3">Stock</th>
              <th className="p-3">Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="ivide-y divide-palm/20 bg-[#E5E4C1]">
            {productos?.data?.map((prod) => (
              <tr key={prod.id} className="transition-colors hover:bg-[#C9C8A6] border-t-1 border-[#0D4012]">
                <td className=" ">
                  <div className="p-4 ">
                    {prod.imagen_url && (
                      <img src={prod.imagen_url} alt="" className="w-10 h-10 object-cover shadow-sm" />
                    )}
                    </div>
                </td>
                <td className="px-6 py-4">
                      <p className="font-bold text-sm text-[#0D4012] ">{prod.nombre}</p>
                      <p className="text-xs text-black max-w-[200px] truncate">{prod.descripcion}</p>
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
                  <span className="font-semibold text-black">${prod.precio_base}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${prod.stock_cantidad > 10 ? "bg-palm/30 text-black" : "bg-red-100 text-red-600 border-1 border-red"
                    }`}>
                    {prod.stock_cantidad}
                    {prod.stock_cantidad <= 10 ? " Stock Bajo" :"" }
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${prod.is_active ? "bg-palm/30 text-black" : "bg-gray-100 text-gray-500"
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
        <div className="py-2 border-t-1 border-[#0D4012] flex items-center justify-between sitcky">
          <div className="flex flex-row align-center px-3  items-center">
            <button
              onClick={handleVerMas}
              className="mt-2 px-3 py-1 text-sm text-black hover:text-black hover:bg-fern rounded-lg transition-colors font-medium"
            >
              Ver más
            </button>
          </div>
        </div>

        {(!productos?.data || productos.data.length === 0) && (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-black">No hay productos</h3>
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
