
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Configuracoes from "./pages/Configuracoes";
import Estoque from "./pages/Estoque";
import Requisicoes from "./pages/Requisicoes";
import Cotacao from "./pages/Cotacao";
import ResumoPedido from "./pages/ResumoPedido";
import HistoricoRequisicoes from "./pages/HistoricoRequisicoes";
import Transferencias from "./pages/Transferencias";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/estoque"
              element={
                <ProtectedRoute>
                  <Estoque />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requisicoes"
              element={
                <ProtectedRoute>
                  <Requisicoes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cotacao"
              element={
                <ProtectedRoute>
                  <Cotacao />
                </ProtectedRoute>
              }
            />
            <Route
              path="/resumo-pedido"
              element={
                <ProtectedRoute>
                  <ResumoPedido />
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
                <ProtectedRoute>
                  <Transferencias />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
