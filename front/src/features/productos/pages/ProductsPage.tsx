import { getUnidadesMedida, getUnidadesMedidaById } from "../../unidadMedida/services/unidadMedida.services";
import { ProductoModal } from "../components/ProductoModal";
import { useProductos } from "../hooks/productosHooks";
import { useAuthStore } from "../../../store/authStore";

export const ProductsPage = () => {
  const {
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
    errorMessage
  } = useProductos();

  const hasRole = useAuthStore((state) => state.hasRole);
  const isAdmin = hasRole("admin");

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando productos...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar productos</div>;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl">
      <div className="mb-5">
        <div className="flex items-center justify-between pb-2 mb-5 border-b" >
          <div>
            <h1 className="text-3xl font-bold text-[#006D35] tracking-tight ">Gestión de Productos</h1>
            <p className="text-gray-600 mt-1">Gestiona el catálogo de productos</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setModal({ type: "create" })}
              className=" bg-[#47AA66] text-black font-semibold shadow-md rounded-full px-3 pb-1 hover:bg-[#699D64] transition-colors duration-300"
            >
              <span className="text-lg">+</span>
              Nuevo producto
            </button>
          )}
        </div>
        <div className="flex flex-row justify-between pb-4">
          <ul>
            <li>
              <div className="flex flex-wrap gap-1 pt-2.5">
                 <button
                  onClick={() => handleFilterProductos(undefined, "")}
                  className="px-3 py-1.5 ml-3 bg-[#47AA66] text-black text-xs rounded-full font-semibold shadow-md hover:bg-[#699D64] transition-colors duration-300"
                >
                  Todos
                </button>
                {categorias?.data?.length
                  ? categorias.data.map(c => (
                    <button key={c.id} onClick={() => handleFilterProductos(c.id)}
                      className="px-3 py-1.5 text-black text-xs rounded-full font-medium shadow-md border-1 border-[#0D4012] hover:bg-[#699D64] transition-colors duration-300">
                      {c.nombre}
                    </button>
                  ))
                  : <span className="text-xs text-black">—</span>
                }
              </div>
            </li>
          </ul>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={nombreFilter}
              onChange={(e) => setNombreFilter(e.target.value)}
              className="px-3 py-1.5 border border-[#0D4012] rounded-sm text-xs text-[#0D4012] placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-[#0D4012] w-48 font-medium"
            />
            <button onClick={() => handleFilterProductos(categoriaFiltrada ?? undefined, "")} title="Aplicar Filtros">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 6h16" /><path d="M6 12h12" /><path d="M9 18h6" /></svg>
            </button>
          </div>
        </div>
      </div>
     <div className="flex-1 rounded-xl border border-[#0D4012] overflow-y-auto min-h-0 shadow-lg custom-scrollbar">
        <table className="w-full text-left table-fixed shadow-lg  ">
          <thead className="border-[#0D4012] ">
            <tr className="sticky top-0 z-10 bg-[#F4F3CF] text-center  font-normal text-[#0D4012] text-xs uppercase ">
              <th className="p-3 ">Img</th>
              <th className="p-3">Producto</th>
              <th className="p-3">Categorías</th>
              <th className="p-3">Ingredientes</th>
              <th className="text-xs font-semibold ">Precio</th>
              <th className="p-3" >Unidad</th>
              <th className="">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palm/20 bg-[#E5E4C1]">
            {ordenarProductos(productos?.data || []).map((prod) => (
              <tr key={prod.id} className="transition-colors text-center hover:bg-[#C9C8A6] border-t-1 border-[#0D4012]">
                <td className=" ">
                  <div className="flex align-center justify-center">
                    {prod.imagen_url && (
                      <img src={prod.imagen_url} alt="" className="w-10 h-10 object-cover shadow-sm" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-start">
                  <p className="font-bold text-sm text-[#0D4012]">{prod.nombre}</p>
                  <p className="text-xs text-black max-w-[200px] truncate ">{prod.descripcion}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 justify-center">
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
                  <div 
                    className="text-xs text-black text-center max-w-[150px] truncate mx-auto font-medium" 
                    title={prod.ingredientes?.map(i => i.nombre).join(", ")}
                  >
                    {prod.ingredientes?.length
                      ? prod.ingredientes.map(i => i.nombre).join(", ")
                      : "—"
                    }
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="font-semibold text-black">${prod.precio_base}</span>
                </td>

                <td className="px-6 py-4">
                  <span className="font-semibold text-black">{prod.unidad_medida.simbolo}</span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {isAdmin && (
                      <button title="editar producto"
                        onClick={() => setModal({ type: "edit", producto: prod })}
                        className="p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-2 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-pencil">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                          <path d="M13.5 6.5l4 4" />
                        </svg>
                      </button>
                    )}
                    <button title="cambiar estado"
                      onClick={() => prod.id && changeStateMutation.mutate(prod.id)}
                      className={`p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-3 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium ${prod.is_active ? "border-2" : "border-[#647D37]"}`}
                    >
                      {prod.is_active == true ?
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-eye ">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                          <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                        </svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-eye-off">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"  />
                          <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                          <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
                          <path d="M3 3l18 18" />
                        </svg>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="py-2 border-t-1 border-[#0D4012] flex items-center justify-between px-4 bg-[#F4F3CF] sticky bottom-0">
          <span className="text-sm text-[#0D4012] font-semibold">
            Página {currentPage} de {totalPages} | {productos?.data?.length} Productos
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-[#0D4012] hover:bg-[#C9C8A6] rounded-lg transition-colors font-medium disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-sm text-[#0D4012] hover:bg-[#C9C8A6] rounded-lg transition-colors font-medium disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Siguiente
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
        unidadesMedidaDisponibles={unidadesMedida?.data ?? []}
        onAssignCategorias={handleAssignCategorias}
        onAssignIngredientes={handleAssignIngredientes}
        errorMessage={errorMessage}
      />
    </div>
  );
};
