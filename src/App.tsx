
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState } from "react";
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
import GestaoCd from "./pages/GestaoCd";
import TransferenciasCD from "./pages/TransferenciasCD";
import NotFound from "./pages/NotFound";

function App() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

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
                  <ProtectedRoute allowedTypes={['estoque', 'cd', 'comprador']}>
                    <Estoque />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/requisicoes" 
                element={
                  <ProtectedRoute allowedTypes={['requisitante', 'estoque']}>
                    <Requisicoes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cotacao" 
                element={
                  <ProtectedRoute allowedTypes={['comprador']}>
                    <Cotacao />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/resumo-pedido" 
                element={
                  <ProtectedRoute allowedTypes={['comprador']}>
                    <ResumoPedido />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/historico-requisicoes" 
                element={
                  <ProtectedRoute allowedTypes={['comprador', 'requisitante', 'cd']}>
                    <HistoricoRequisicoes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/historico-pedidos" 
                element={
                  <ProtectedRoute allowedTypes={['comprador']}>
                    <HistoricoPedidos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transferencias" 
                element={
                  <ProtectedRoute allowedTypes={['transferencia', 'requisitante', 'cd']}>
                    <Transferencias />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gestao-cd" 
                element={
                  <ProtectedRoute allowedTypes={['cd']}>
                    <GestaoCd />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transferencias-cd" 
                element={
                  <ProtectedRoute allowedTypes={['cd']}>
                    <TransferenciasCD />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/configuracoes" 
                element={
                  <ProtectedRoute allowedTypes={['master']}>
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
