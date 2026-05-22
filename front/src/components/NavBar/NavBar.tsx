import { Link, useLocation, useNavigate } from "react-router-dom"; // Agregamos useNavigate
import React from 'react'; // Eliminamos useState ya que no lo usas aquí
import { requestLogout } from "../../features/auth/services/auth.services";


const navLinks = [
  { label: "Productos", href: "/" },
  { label: "Categorías", href: "/categorias" },
  { label: "Ingredientes", href: "/ingredientes" },
];

export const NavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate(); // Hook para redireccionar sin recargar toda la pestaña

  const handleLogout = async () => {
    try {
      await requestLogout();
      // En lugar de recargar la ventana bruscamente, redirigimos al login
      navigate('/login'); 
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      {/* ── SIDEBAR DESKTOP ── */}
      {/* Explicación: flex flex-col justify-between separa el contenido superior del inferior */}
      <aside className="w-64 h-screen bg-[#F1F0CC] flex flex-col justify-between p-4 text-white border-1 border-[#0D4012]">
        
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
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className={`block px-4 py-2.5 font-semibold rounded-full transition-colors duration-350 ${
                        isActive 
                          ? "bg-[#47AA66] text-black font-semibold shadow-md" 
                          : "text-[#544518] hover:bg-[#47AA66] hover:text-[#F1F0CC]"
                      }`}
                    >
                      {link.label}
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
            title="Cerrar sesión"
          >
            <span>Cerrar sesión</span>
          </button>
          <button
            onClick={() => window.open("https://th.bing.com/th/id/OIP.sLmQNMCeYYIEwkj4hTprGAHaIJ?w=170&h=187&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3", "_blank")}
            className="w-full text-center px-4 p-1 rounded-full text-[#544518] hover:bg-[#699D64] font-semibold  duration-600 text-sm font-medium"
            title="Soporte"
          >
            <span>Soporte</span>
          </button>
        </div>

      </aside>
    </>
  );
};