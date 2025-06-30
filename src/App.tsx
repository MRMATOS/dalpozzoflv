
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HybridAuthProvider } from "@/contexts/HybridAuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import HybridAuth from "./pages/HybridAuth";
import Auth from "./pages/Auth";
import Estoque from "./pages/Estoque";
import Requisicoes from "./pages/Requisicoes";
import Cotacao from "./pages/Cotacao";
import ResumoPedido from "./pages/ResumoPedido";
import Configuracoes from "./pages/Configuracoes";
import HistoricoRequisicoes from "./pages/HistoricoRequisicoes";
import HistoricoPedidos from "./pages/HistoricoPedidos";
import GestaoCd from "./pages/GestaoCd";
import TransferenciasCD from "./pages/TransferenciasCD";
import Transferencias from "./pages/Transferencias";
import AdminPermissions from "./pages/AdminPermissions";
import HybridProtectedRoute from "./components/HybridProtectedRoute";
import NotFound from "./pages/NotFound";
import RecebimentoDashboard from "@/pages/RecebimentoDashboard";
import NovoRecebimento from "@/pages/NovoRecebimento";
import RecebimentoAtivo from "@/pages/RecebimentoAtivo";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HybridAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<HybridAuth />} />
              <Route path="/auth-old" element={<Auth />} />
              <Route 
                path="/dashboard" 
                element={
                  <HybridProtectedRoute>
                    <Dashboard />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/estoque" 
                element={
                  <HybridProtectedRoute>
                    <Estoque />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/requisicoes" 
                element={
                  <HybridProtectedRoute>
                    <Requisicoes />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/cotacao" 
                element={
                  <HybridProtectedRoute>
                    <Cotacao />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/resumo-pedido" 
                element={
                  <HybridProtectedRoute>
                    <ResumoPedido />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/configuracoes" 
                element={
                  <HybridProtectedRoute requiredRole="master">
                    <Configuracoes />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/historico-requisicoes" 
                element={
                  <HybridProtectedRoute>
                    <HistoricoRequisicoes />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/historico-pedidos" 
                element={
                  <HybridProtectedRoute>
                    <HistoricoPedidos />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/gestao-cd" 
                element={
                  <HybridProtectedRoute allowedTypes={['master', 'cd']}>
                    <GestaoCd />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/transferencias-cd" 
                element={
                  <HybridProtectedRoute allowedTypes={['master', 'cd']}>
                    <TransferenciasCD />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/transferencias/:lojaDestino" 
                element={
                  <HybridProtectedRoute allowedTypes={['master', 'cd']}>
                    <Transferencias />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/admin/permissions" 
                element={
                  <HybridProtectedRoute requiredRole="master">
                    <AdminPermissions />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/recebimento" 
                element={
                  <HybridProtectedRoute>
                    <RecebimentoDashboard />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/recebimento/novo" 
                element={
                  <HybridProtectedRoute>
                    <NovoRecebimento />
                  </HybridProtectedRoute>
                } 
              />
              <Route 
                path="/recebimento/:id" 
                element={
                  <HybridProtectedRoute>
                    <RecebimentoAtivo />
                  </HybridProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </HybridAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
