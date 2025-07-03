import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
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
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import RecebimentoDashboard from "@/pages/RecebimentoDashboard";
import NovoRecebimento from "@/pages/NovoRecebimento";
import RecebimentoAtivo from "@/pages/RecebimentoAtivo";
import HistoricoRecebimentos from "@/pages/HistoricoRecebimentos";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
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
                path="/configuracoes" 
                element={
                  <ProtectedRoute requiredRole="master">
                    <Configuracoes />
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
                path="/historico-pedidos" 
                element={
                  <ProtectedRoute>
                    <HistoricoPedidos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gestao-cd" 
                element={
                  <ProtectedRoute allowedTypes={['master', 'cd']}>
                    <GestaoCd />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transferencias-cd" 
                element={
                  <ProtectedRoute allowedTypes={['master', 'cd']}>
                    <TransferenciasCD />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/transferencias/:lojaDestino" 
                element={
                  <ProtectedRoute allowedTypes={['master', 'cd']}>
                    <Transferencias />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/permissions" 
                element={
                  <ProtectedRoute requiredRole="master">
                    <AdminPermissions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recebimento" 
                element={
                  <ProtectedRoute>
                    <RecebimentoDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recebimento/novo" 
                element={
                  <ProtectedRoute>
                    <NovoRecebimento />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recebimento/:id" 
                element={
                  <ProtectedRoute>
                    <RecebimentoAtivo />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/recebimento/historico" 
                element={
                  <ProtectedRoute>
                    <HistoricoRecebimentos />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;