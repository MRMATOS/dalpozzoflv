
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Estoque from "./pages/Estoque";
import Requisicoes from "./pages/Requisicoes";
import Cotacao from "./pages/Cotacao";
import ResumoPedido from "./pages/ResumoPedido";
import HistoricoRequisicoes from "./pages/HistoricoRequisicoes";
import HistoricoPedidos from "./pages/HistoricoPedidos";
import Configuracoes from "./pages/Configuracoes";
import Transferencias from "./pages/Transferencias";
import NotFound from "./pages/NotFound";

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
                path="/estoque" 
                element={
                  <ProtectedRoute allowedRoles={['estoque']}>
                    <Estoque />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/requisicoes" 
                element={
                  <ProtectedRoute allowedRoles={['requisitante']}>
                    <Requisicoes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cotacao" 
                element={
                  <ProtectedRoute allowedRoles={['comprador']}>
                    <Cotacao />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resumo-pedido" 
                element={
                  <ProtectedRoute allowedRoles={['comprador']}>
                    <ResumoPedido />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/historico-requisicoes" 
                element={
                  <ProtectedRoute allowedRoles={['comprador', 'requisitante']}>
                    <HistoricoRequisicoes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/historico-pedidos" 
                element={
                  <ProtectedRoute allowedRoles={['comprador']}>
                    <HistoricoPedidos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transferencias" 
                element={
                  <ProtectedRoute allowedRoles={['transferencia', 'requisitante']}>
                    <Transferencias />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracoes" 
                element={
                  <ProtectedRoute allowedRoles={['master']}>
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
