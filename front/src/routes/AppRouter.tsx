import { BrowserRouter, Route, Routes } from "react-router-dom";
import { NavBar } from "../shared/NavBar/NavBar";
import { CategoryPage } from "../features/categoria/pages/CategoryPage";
import { IngredientsPage } from "../features/ingredientes/pages/IngredientsPage";
import { ProductsPage } from "../features/productos/pages/ProductsPage";
import { AuthLayout } from "../shared/layout/AuthLayout";
import { LoginPage } from "../features/auth/components/LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PedidoPage } from "../features/pedidos/pages/PedidosPage";
import { PedidoDetailPage } from "../features/pedidos/pages/PedidoDetailPage";
import { UsuariosPage } from "../features/usuarios/pages/UsuariosPage";


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
            path="*"
            element={
              <>
                <div className="flex h-screen overflow-hidden bg-[#F4F3CF] ">
                  <NavBar />
                  <main className="flex-1 flex flex-col min-h-0 mx-auto max-w-6xl py-8">
                    <Routes>
                      <Route element={<ProtectedRoute allowedRoles={["admin", "stock"]} />}>
                        <Route path="/" element={<ProductsPage />} />
                      </Route>
                      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                        <Route path="/categorias" element={<CategoryPage />} />
                        <Route path="/ingredientes" element={<IngredientsPage />} />
                        <Route path="/usuarios" element={<UsuariosPage />} />
                      </Route>
                      <Route element={<ProtectedRoute allowedRoles={["admin", "pedidos"]} />}>
                        <Route path="/pedidos" element={<PedidoPage />} />
                        <Route path="/pedidos/:id" element={<PedidoDetailPage />} />
                      </Route>
                      <Route path="*" element={<img className="flex items-center justify-center w-screen h-screen" src="src/assets/logoAccesoDenegado.png" alt="404" />} />
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


