import { CategoriaModal } from "../components/CategoriaModal";
import { useCategorias } from "../hooks/categoriaHooks";
import type { ICategoria } from "../ICategoria";

export const CategoryPage = () => {
  const {
    modal,
    setModal,
    handleCloseModal,
    handleSubmit,
    categories,
    isLoading,
    isError,
    deleteMutation,
  } = useCategorias();

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando categorías...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar categorías</div>;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl">
      <div className="mb-5">
        <div className="flex items-center justify-between pb-2 mb-5 flex-shrink-0 border-b-1 border-[#0D4012] " >
          <div>
            <h1 className="text-3xl font-bold text-[#006D35] tracking-tight">Gestión de Categorías</h1>
            <p className="text-gray-600 mt-1">Gestiona las categorías</p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className=" bg-[#47AA66] text-black font-semibold shadow-md rounded-full px-3 pb-1 hover:bg-[#699D64] transition-colors duration-300"
          >
            <span className="text-lg">+</span>
            Nueva categoría
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-[#0D4012] overflow-y-auto min-h-0 shadow-lg custom-scrollbar">
        <table className="w-full h-full text-left table-fixed shadow-lg">
          <thead className="border-[#0D4012] ">
            <tr className="sticky top-0 z-10 bg-[#F4F3CF] text-center  font-normal text-[#0D4012] text-xs uppercase ">
              <th className="p-3">Nombre</th>
              <th className="p-3">Categoría Padre</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="ivide-y divide-palm/20 bg-[#E5E4C1]">
            {(categories as { data?: ICategoria[] }).data?.map((cat) => (
              <tr key={cat.id} className="h-20 transition-colors text-center hover:bg-[#C9C8A6]  border-t-1 border-[#0D4012]">
                <td className="">
                  <div className="flex align-center pl-15 items-center gap-10">
                    {cat.imagen_url && (
                      <img src={cat.imagen_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div className="flex flex-col">
                    <p className="font-bold text-[#0D4012]">{cat.nombre}</p>
                    <p className="text-sm text-black max-w-[200px] truncate ">{cat.descripcion}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                   {cat.parent_id && (
                      <span className="px-2 py-0.5  items-center bg-fern/15 text-black text-xs rounded-full font-medium">
                        {(categories as { data?: ICategoria[] }).data?.find(c => c.id === cat.parent_id)?.nombre || "-"}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setModal({ type: "edit", categoria: cat })}
                      className="p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-2 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-pencil">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                        <path d="M13.5 6.5l4 4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => cat.id && deleteMutation.mutate(cat.id)}
                      className={`p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-3 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium ${cat.is_active ? "border-2" : "border-[#647D37]"}`}
                    >
                      {cat.is_active == true ?
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

        {(!(categories as { data?: ICategoria[] }).data || (categories as { data?: ICategoria[] }).data!.length === 0) && (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-black">No hay categorías</h3>
            <p className="text-black mt-1">Comienza creando una nueva categoría.</p>
          </div>
        )}
      </div>

      <CategoriaModal
        isOpen={modal.type === "create" || modal.type === "edit"}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        categoriasDisponibles={(categories as { data?: ICategoria[] }).data || []}
        categoriaParaEditar={modal.type === "edit" ? modal.categoria : null}
      />
    </div>
  );
};
