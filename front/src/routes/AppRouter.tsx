import { Route, Routes } from "react-router-dom";
import { NavBar } from "../components/NavBar/NavBar";
import { CategoryPage } from "../pages/CategoryPage";
import { IngredientsPage } from "../pages/IngredientsPage";
import { ProductsPage } from "../pages/ProductsPage";

const AppRouter = () => {
  return (
    <>
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/categorias" element={<CategoryPage />} />
          <Route path="/ingredientes" element={<IngredientsPage />} />
          <Route path="*" element={<div className="p-8 text-center text-gray-500 text-2xl">404 — Página no encontrada</div>} />
        </Routes>
      </main>
    </>
  );
};

export default AppRouter;


