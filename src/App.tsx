
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';

// Importar todas as páginas
import Index from './pages/Index';
import Auth from './pages/Auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Configuracoes from './pages/Configuracoes';
import Estoque from './pages/Estoque';
import Requisicoes from './pages/Requisicoes';
import HistoricoRequisicoes from './pages/HistoricoRequisicoes';
import Transferencias from './pages/Transferencias';
import Cotacao from './pages/Cotacao';
import ResumoPedido from './pages/ResumoPedido';
import HistoricoPedidos from './pages/HistoricoPedidos';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
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
              path="/configuracoes"
              element={
                <ProtectedRoute allowedTypes={['master']}>
                  <Configuracoes />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/estoque"
              element={
                <ProtectedRoute allowedTypes={['estoque', 'master']}>
                  <Estoque />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/requisicoes"
              element={
                <ProtectedRoute allowedTypes={['requisitante', 'master']}>
                  <Requisicoes />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/historico-requisicoes"
              element={
                <ProtectedRoute allowedTypes={['requisitante', 'comprador', 'master']}>
                  <HistoricoRequisicoes />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/transferencias"
              element={
                <ProtectedRoute allowedTypes={['estoque', 'master']}>
                  <Transferencias />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/cotacao"
              element={
                <ProtectedRoute allowedTypes={['comprador', 'master']}>
                  <Cotacao />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/resumo-pedido"
              element={
                <ProtectedRoute allowedTypes={['comprador', 'master']}>
                  <ResumoPedido />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/historico-pedidos"
              element={
                <ProtectedRoute allowedTypes={['comprador', 'master']}>
                  <HistoricoPedidos />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
