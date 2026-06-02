import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";


const navLinks = [

  { label: "Productos", icono: 
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"  >
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M4 15h16a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4" />
	<path d="M12 4c3.783 0 6.953 2.133 7.786 5h-15.572c.833 -2.867 4.003 -5 7.786 -5" />
	<path d="M5 12h14" />
</svg>, href: "/" },

  { label: "Categorías",icono: 
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"  >
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M14 4h6v6h-6l0 -6" />
	<path d="M4 14h6v6h-6l0 -6" />
	<path d="M14 17a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
	<path d="M4 7a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  </svg> , href: "/categorias" },

  { label: "Ingredientes", icono: 
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" >
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M19 14.083c0 4.154 -2.966 6.74 -7 6.917c-4.2 0 -7 -2.763 -7 -6.917c0 -5.538 3.5 -11.09 7 -11.083c3.5 .007 7 5.545 7 11.083" />
  </svg>, href: "/ingredientes" },

  { label: "Pedidos", icono: 
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" >
	<path stroke="none" d="M0 0h24v24H0z" fill="none" />
	<path d="M9 6h14l-4 4l4 4h-14l0 -8z" />
	<path d="M4 6h4" />
	<path d="M4 12h4" />
	<path d="M4 18h4" />
  </svg>, href: "/pedidos" },

  { label: "Usuarios", icono: 
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-user">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
    <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
  </svg>, href: "/usuarios" },

];

export const NavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate(); 
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      {/* ── SIDEBAR DESKTOP ── */}
      {/* Explicación: flex flex-col justify-between separa el contenido superior del inferior */}
      <aside className="w-64 h-screen bg-[#E5E4C1] flex flex-col justify-between p-4 text-white border-1 border-[#0D4012]">
        
        {/* CONTENEDOR SUPERIOR */}
        <div>
          {/* Logo + título con padding y separación */}
          <div className="flex flex-col items-center py-4 mb-6">
            <div className="text-3xl text-[#544518] bg-[#887543] font-bold rounded-full w-20 h-20 flex items-center justify-center">
              <h1>BP</h1>
            </div>
            <span className="text-2xl font-bold tracking-wide block text-[#0D4012]">
              BigPickle
            </span>
            <span className="text-xl font-bold tracking-wide block text-[#0D4012]">
              Admin
            </span>
            <span className="text-md font-medium tracking-wide block text-[#606044]">
              Gestión de cocina
            </span>

            
            
          </div>

          

          {/* Links */}
          <nav>
            <ul className="space-y-1.5">
              <li className="mb-9">
                <Link
                  to={"/"}
                  className={`flex items-center gap-2 m-2 px-4 py-2 font-semibold rounded-full transition-colors duration-350 bg-[#47AA66] text-black font-semibold shadow-md text-[#544518] hover:bg-[#47AA66] hover:text-[#F1F0CC]`}
                >
                  <span className="text-lg">+</span>
                  Nuevo producto
                </Link>
              </li>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-full transition-colors duration-350 ${
                        isActive 
                          ? "bg-[#47AA66] text-black font-semibold shadow-md" 
                          : "text-[#544518] hover:bg-[#47AA66] hover:text-[#F1F0CC]"
                      }`}
                    >
                      <samp className="text-lg">{link.icono}</samp> 
                      <samp>{link.label}</samp>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* CONTENEDOR INFERIOR (Cerrar Sesión) */}
        <div className="flex gap-1 flex-col pt-4 border-t border-[#544518]">
          <button
            onClick={handleLogout}
            className="w-full text-center px-4 p-1 rounded-full text-[#544518] hover:bg-[#B53B3B] hover:text-[#F1F0CC] font-semibold  duration-300 text-sm font-medium"
          >
            <span>Cerrar sesión</span>
          </button>
          <button
            onClick={() => {
              document.body.classList.toggle("soporte-activo");
              document.body.classList.toggle("animate-spin");
            }}
            className="w-full text-center px-4 p-1 rounded-full text-[#544518] hover:bg-[#699D64] font-semibold  duration-600 text-sm font-medium"
          >
            <span>Soporte</span>
          </button>
        </div>

      </aside>
    </>
  );
};