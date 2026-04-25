import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Productos", href: "/"},
  { label: "Categorías", href: "/categorias" },
  { label: "Ingredientes", href: "/ingredientes" },
];

export const NavBar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 w-full bg-hunter border-b border-fern backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group transition-all">
          <div className="w-10 h-10 bg-fern rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <span className="text-black font-black text-lg">A</span>
          </div>
          <span className="text-black font-bold text-lg tracking-tight">APP</span>
        </Link>

        <ul className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-fern text-black"
                      : "text-black hover:text-black hover:bg-fern/40"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-lime-cream rounded-full" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
