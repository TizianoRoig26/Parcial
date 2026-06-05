import { useAuthStore } from "../../../store/authStore";
import { UsuariosModal } from "../components/UsuariosModal";
import { useUsuarios } from "../hooks/usuariosHooks";

export const UsuariosPage = () => {
  const {
    modal,
    setModal,
    handleClose,
    usuarios,
    isLoading,
    isError,
    handleSubmit,
    errorMessage,
    toggleStatusMutation,
  } = useUsuarios();

  const hasRole = useAuthStore((state) => state.hasRole);
  const isAdmin = hasRole("admin");

  if (isLoading) return <div className="p-8 text-center text-black animate-pulse">Cargando usuarios...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error al cargar usuarios</div>;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden rounded-b-xl">
      <div className="mb-5">
        <div className="flex items-center justify-between pb-2 mb-5 border-b" >
          <div>
            <h1 className="text-3xl font-bold text-[#006D35] tracking-tight ">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">Gestiona los usuarios</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setModal({ type: "create" })}
              className=" bg-[#47AA66] text-black font-semibold shadow-md rounded-full px-3 pb-1 hover:bg-[#699D64] transition-colors duration-300"
            >
              <span className="text-lg">+</span>
              Nuevo usuario
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 rounded-xl border-[#0D4012] border-1 overflow-y-auto min-h-0 shadow-lg custom-scrollbar">
        <table className="w-full text-left table-fixed shadow-lg  rounded-xl">
          <thead className="border-[#0D4012] ">
            <tr className="sticky top-0 z-10 bg-[#F4F3CF] text-center  font-normal text-[#0D4012] text-xs uppercase ">
              <th className="p-3 ">Username</th>
              <th className="p-3">Nombre Completo</th>
              <th className="p-3">Email</th>
              <th className="p-3">Roles</th>
              <th className="p-3" >Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palm/20 bg-[#E5E4C1]">
            {usuarios?.map((user) => (
              <tr key={user.id} className="transition-colors  text-center hover:bg-[#C9C8A6] border-t-1 border-[#0D4012]">
                <td className=" px-6 py-4 text-start ">
                  <p className="font-bold text-sm text-[#0D4012] ">{user.username}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 justify-center text-sm text-black">
                    {user.full_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-semibold text-black text-sm">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {user.roles?.length
                      ? user.roles.map(r => (
                          <span key={r.codigo}className="px-2 py-0.5 bg-fern/15 text-black text-xs rounded-full font-medium">
                            {r.nombre}
                          </span>
                        ))
                      : <span className="text-xs text-black">—</span>
                    }
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {isAdmin && (
                      <button title="editar usuario"
                        onClick={() => setModal({ type: "edit", usuario: user })}
                        className="p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-2 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-pencil">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                          <path d="M13.5 6.5l4 4" />
                        </svg>
                      </button>
                    )}
                    <button title={user.disabled ? "activar usuario" : "desactivar usuario"}
                      onClick={() => user.id && toggleStatusMutation.mutate({ id: user.id, disabled: user.disabled })}
                      className={`p-1 text-sm text-[#0D4012] hover:text-[#002204] hover:border-3 rounded-full border-1 border-[#0D4012] hover:bg-[#C9C8A6] transition-colors font-medium`}
                    >
                      {user.disabled ?
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-eye-off">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none"  />
                          <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                          <path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
                          <path d="M3 3l18 18" />
                        </svg>
                        :
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon icon-tabler icons-tabler-outline icon-tabler-eye">
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                          <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                        </svg>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!usuarios || usuarios.length === 0) && (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-black">No hay usuarios</h3>
          </div>
        )}
      </div>

      <UsuariosModal
        isOpen={modal.type === "create" || modal.type === "edit"}
        onClose={handleClose}
        onSubmit={handleSubmit}
        usuarioParaEditar={modal.type === "edit" ? modal.usuario : null}
        errorMessage={errorMessage}
      />
    </div>
  );
};
