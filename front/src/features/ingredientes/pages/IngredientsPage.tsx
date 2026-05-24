import { IngredienteModal } from "../components/IngredienteModal";
import { useIngredientes } from "../hooks/ingredientesHooks";

export const IngredientsPage = () => {
  const {
    modal,
    setModal,
    handleClose,
    ingredientes,
    isLoading,
    isError,
    handleSubmit,
    deleteMutation,
    handleFilterAlergenos,
    ordenarIngredientes,
    handleVerMas
  } = useIngredientes();

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando ingredientes...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar ingredientes</div>;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl">
      <div className="mb-5">
        <div className="flex items-center justify-between pb-2 mb-5 border-b" >
          <div>
            <h1 className="text-3xl font-bold text-[#006D35] tracking-tight ">Gestión de ingredientes</h1>
            <p className="text-gray-600 mt-1">Gestiona el catálogo de ingredientes</p>
          </div>
          <button
            onClick={() => setModal({ type: "create" })}
            className=" bg-[#47AA66] text-black font-semibold shadow-md rounded-full px-3 pb-1 hover:bg-[#699D64] transition-colors duration-300"
          >
            <span className="text-lg">+</span>
            Nuevo ingrediente
          </button>
        </div>
        <div>
          <ul className="flex flex-row gap-3">
            <li className="px-3 py-1.5 text-black text-xs rounded-full font-medium shadow-md border-1 border-[#0D4012]">
                <button onClick={() => handleFilterAlergenos(undefined)} className="cursor-pointer" >
                  Todos
                </button> 
            </li>
            <li className="px-3 py-1.5 text-black text-xs rounded-full font-medium shadow-md border-1 border-[#0D4012]">
                <button onClick={() => handleFilterAlergenos(true)} className="cursor-pointer" >
                  Alérgenos
                </button>
            </li>
            <li className="px-3 py-1.5 text-black text-xs rounded-full font-medium shadow-md border-1 border-[#0D4012]">
                <button onClick={() => handleFilterAlergenos(false)} className="cursor-pointer" >
                  No Alérgenos
                </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex-1 rounded-xl border border-[#0D4012] overflow-y-auto min-h-0 shadow-lg custom-scrollbar">
        <table className="w-full text-left table-fixed shadow-lg  ">
          <thead className="border-[#0D4012] ">
            <tr className="sticky top-0 z-10 bg-[#F4F3CF] text-center  font-normal text-[#0D4012] text-xs uppercase ">
              <th className="px-6 py-4 font-bold">Nombre</th>
              <th className="px-6 py-4 font-bold">Descripción</th>
              <th className="px-6 py-4 font-bold text-center">Alérgeno</th>
              <th className="px-6 py-4 font-bold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palm/20 bg-[#E5E4C1]">
            {ordenarIngredientes(ingredientes?.data)?.map((ing) => (
              <tr key={ing.id} className={`transition-colors text-center hover:bg-[#C9C8A6] border-t-1 border-[#0D4012]`}>
                <td className="px-6 py-4 text-lg font-semibold text-[#0D4012]">{ing.nombre}</td>
                <td className="px-6 py-4 text-[#0D4012] text-sm max-w-xs truncate">{ing.descripcion || "—"}</td>
                <td className=" text-center ">
                  {ing.es_alergeno
                    ? <span className="border-2 border-[#ba1a1a] bg-[#ba1a1a]/10 px-3 py-1.5 rounded-full">Sí</span>
                    : <span>No</span>
                  }
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setModal({ type: "edit", ingrediente: ing })}
                      className="p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-2 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-pencil">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                        <path d="M13.5 6.5l4 4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => ing.id && deleteMutation.mutate(ing.id)}
                      className={`p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-3 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium ${ing.is_active ? "border-2" : "border-[#647D37]"}`}
                    >
                      {ing.is_active == true ?
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
        <div className="flex justify-center items-center">
          <button onClick={() => handleVerMas()} className="cursor-pointer" >
            Mostrar mas
          </button>
        </div>

        {(!ingredientes?.data || ingredientes.data.length === 0) && (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-black">No hay ingredientes</h3>
            <p className="text-black mt-1">Comienza creando el primer ingrediente.</p>
          </div>
        )}
      </div>

      <IngredienteModal
        isOpen={modal.type === "create" || modal.type === "edit"}
        onClose={handleClose}
        onSubmit={handleSubmit}
        ingredienteParaEditar={modal.type === "edit" ? modal.ingrediente : null}
      />
    </div>
  );
};
