
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Configuracoes from "./pages/Configuracoes";
import Requisicoes from "./pages/Requisicoes";
import Cotacao from "./pages/Cotacao";
import ResumoPedido from "./pages/ResumoPedido";
import Estoque from "./pages/Estoque";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import HistoricoRequisicoes from "./pages/HistoricoRequisicoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute requiredRole="master">
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="/requisicoes" element={
              <ProtectedRoute>
                <Requisicoes />
              </ProtectedRoute>
            } />
            <Route path="/historico-requisicoes" element={
              <ProtectedRoute>
                <HistoricoRequisicoes />
              </ProtectedRoute>
            } />
            <Route path="/cotacao" element={
              <ProtectedRoute>
                <Cotacao />
              </ProtectedRoute>
            } />
            <Route path="/resumo-pedido" element={
              <ProtectedRoute>
                <ResumoPedido />
              </ProtectedRoute>
            } />
            <Route path="/estoque" element={
              <ProtectedRoute>
                <Estoque />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
