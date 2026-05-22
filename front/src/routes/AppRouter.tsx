import { BrowserRouter, Route, Routes } from "react-router-dom";
import { NavBar } from "../components/NavBar/NavBar";
import { CategoryPage } from "../features/categoria/pages/CategoryPage";
import { IngredientsPage } from "../features/ingredientes/pages/IngredientsPage";
import { ProductsPage } from "../features/productos/pages/ProductsPage";
import { AuthLayout } from "../components/layout/AuthLayout";
import { LoginPage } from "../features/auth/components/LoginPage";
import { RegisterPage } from "../features/auth/components/RegisterPage";
import { ProtectedRoute } from "./ProtectedRoute";


const AppRouter = () => {
  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <RegisterPage />
            </AuthLayout>
          }
        />
        <Route
          path="*"
          element={
            <>
              <div className="flex h-screen overflow-hidden bg-[#F1F0CC]">
                <NavBar />
                <main className="flex-1 flex flex-col min-h-0 max-w-6xl mx-auto px-6 py-8">
                  <Routes>
                  <Route element={<ProtectedRoute allowedRoles={["admin", "stock"]} />}>
                    <Route path="/" element={<ProductsPage />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                    <Route path="/categorias" element={<CategoryPage />} />
                    <Route path="/ingredientes" element={<IngredientsPage />} />
                  </Route>
                  <Route element={<ProtectedRoute allowedRoles={["admin", "pedidos"]} />}>
                    
                  </Route>
                  <Route path="*" element={<div className="p-8 text-center text-gray-500 text-2xl">404 — Página no encontrada</div>} />
                  </Routes>
                </main>
              </div>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
    </>
  );
};

export default AppRouter;


