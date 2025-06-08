
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Requisicoes from "./pages/Requisicoes";
import Cotacao from "./pages/Cotacao";
import ResumoPedido from "./pages/ResumoPedido";
import HistoricoPedidos from "./pages/HistoricoPedidos";
import HistoricoRequisicoes from "./pages/HistoricoRequisicoes";
import Transferencias from "./pages/Transferencias";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/estoque"
                element={
                  <ProtectedRoute allowedTypes={["estoque", "master"]}>
                    <Estoque />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requisicoes"
                element={
                  <ProtectedRoute allowedTypes={["estoque", "master"]}>
                    <Requisicoes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cotacao"
                element={
                  <ProtectedRoute allowedTypes={["comprador", "master"]}>
                    <Cotacao />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resumo-pedido"
                element={
                  <ProtectedRoute allowedTypes={["comprador", "master"]}>
                    <ResumoPedido />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historico-pedidos"
                element={
                  <ProtectedRoute allowedTypes={["comprador", "master"]}>
                    <HistoricoPedidos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historico-requisicoes"
                element={
                  <ProtectedRoute>
                    <HistoricoRequisicoes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/transferencias"
                element={
                  <ProtectedRoute allowedTypes={["master"]}>
                    <Transferencias />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracoes"
                element={
                  <ProtectedRoute allowedTypes={["master"]}>
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
