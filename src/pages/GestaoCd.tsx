import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  Store,
  AlertCircle,
  Scale,
  History,
  Bell
} from "lucide-react";
import NotificacoesTransferencias from '@/components/transferencias/NotificacoesTransferencias';
import DivergenciasManager from '@/components/transferencias/DivergenciasManager';
import HistoricoTransferencia from '@/components/transferencias/HistoricoTransferencia';

const GestaoCd = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [historicoModal, setHistoricoModal] = useState<{ aberto: boolean; transferenceId?: string }>({ aberto: false });

  // Buscar requisições pendentes por loja (3 lojas específicas)
  const { data: requisicoesPorLoja } = useQuery({
    queryKey: ['requisicoes-cd-por-loja'],
    queryFn: async () => {
      const { data: requisicoes, error } = await supabase
        .from('requisicoes')
        .select(`
          id,
          loja,
          data_requisicao,
          status,
          itens_requisicao(
            quantidade,
            quantidade_calculada,
            produtos(produto, media_por_caixa)
          )
        `)
        .eq('status', 'pendente')
        .neq('loja', 'Home')
        .order('data_requisicao', { ascending: false });

      if (error) throw error;

      // Agrupar por loja
      const porLoja = (requisicoes || []).reduce((acc, req) => {
        if (!acc[req.loja]) {
          acc[req.loja] = {
            loja: req.loja,
            requisicoes: [],
            totalCaixas: 0,
            totalKg: 0,
            ultimaRequisicao: null
          };
        }
        
        acc[req.loja].requisicoes.push(req);
        
        // Calcular totais
        (req.itens_requisicao as any[]).forEach(item => {
          acc[req.loja].totalCaixas += item.quantidade || 0;
          acc[req.loja].totalKg += item.quantidade_calculada || 0;
        });

        // Definir última requisição
        if (!acc[req.loja].ultimaRequisicao || 
            new Date(req.data_requisicao) > new Date(acc[req.loja].ultimaRequisicao)) {
          acc[req.loja].ultimaRequisicao = req.data_requisicao;
        }

        return acc;
      }, {} as Record<string, any>);

      return Object.values(porLoja);
    },
  });

  // Buscar estoque do CD para verificar disponibilidade
  const { data: estoqueCd } = useQuery({
    queryKey: ['estoque-cd'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_atual')
        .select(`
          produto_id,
          quantidade,
          produtos(produto)
        `)
        .eq('loja', 'Home');

      if (error) throw error;
      
      const estoqueMap: Record<string, { quantidade: number; produto: string }> = {};
      data?.forEach(item => {
        estoqueMap[item.produto_id] = {
          quantidade: item.quantidade || 0,
          produto: (item.produtos as any)?.produto || ''
        };
      });

      return estoqueMap;
    },
  });

  const getStatusAtendimento = (loja: string) => {
    // Lógica para determinar status baseado no estoque disponível
    return 'Disponível'; // Simplificado por enquanto
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Gestão CD</h1>
                <p className="text-sm text-gray-500">Centro de Distribuição - {profile?.nome}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
            <TabsTrigger value="divergencias">Divergências</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* ETAPA 5: Cards Resumo por Loja (exatamente 3 cards) */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Requisições Pendentes por Loja
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {requisicoesPorLoja && requisicoesPorLoja.length > 0 ? (
                  requisicoesPorLoja.map((dadosLoja: any) => (
                    <Card key={dadosLoja.loja} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center">
                            <Store className="h-5 w-5 mr-2 text-blue-600" />
                            {dadosLoja.loja}
                          </CardTitle>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {dadosLoja.requisicoes.length} requisições
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Data/Hora:</span>
                            <span className="text-sm font-medium">
                              {dadosLoja.ultimaRequisicao ? 
                                new Date(dadosLoja.ultimaRequisicao).toLocaleString('pt-BR') : 
                                'N/A'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center">
                              <Package className="h-4 w-4 mr-1" />
                              Total Caixas:
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {dadosLoja.totalCaixas}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 flex items-center">
                              <Scale className="h-4 w-4 mr-1" />
                              Total Kg:
                            </span>
                            <span className="text-lg font-bold text-green-600">
                              {dadosLoja.totalKg.toFixed(1)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <Badge variant="outline" className="text-green-700 border-green-700">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {getStatusAtendimento(dadosLoja.loja)}
                            </Badge>
                          </div>
                          
                          <div className="pt-2 border-t">
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => navigate('/transferencias-cd')}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Gerenciar Separação
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  // Mostrar cards vazios para as 3 lojas se não houver requisições
                  ['Loja 1', 'Loja 2', 'Loja 3'].map((loja) => (
                    <Card key={loja} className="border-l-4 border-l-gray-300">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center text-gray-500">
                          <Store className="h-5 w-5 mr-2" />
                          {loja}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-6">
                          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">Nenhuma requisição pendente</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Ações Rápidas para o CD */}
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Ações do Centro de Distribuição</CardTitle>
                  <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => navigate('/transferencias-cd')}
                    >
                      <Truck className="h-6 w-6" />
                      <span>Gestão de Transferências</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => navigate('/historico-requisicoes')}
                    >
                      <Package className="h-6 w-6" />
                      <span>Histórico Requisições</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => navigate('/estoque')}
                    >
                      <Store className="h-6 w-6" />
                      <span>Estoque CD</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 flex flex-col items-center space-y-2"
                      onClick={() => navigate('/configuracoes')}
                      disabled={!profile || profile.tipo !== 'master'}
                    >
                      <AlertCircle className="h-6 w-6" />
                      <span>Configurações</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notificacoes">
            <NotificacoesTransferencias />
          </TabsContent>

          <TabsContent value="divergencias">
            <DivergenciasManager />
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Histórico de Transferências
                </CardTitle>
                <CardDescription>
                  Visualize o histórico completo de todas as transferências realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Selecione uma transferência específica para ver seu histórico detalhado
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setHistoricoModal({ aberto: true })}
                  >
                    Buscar Transferência
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Histórico */}
        <HistoricoTransferencia
          transferenceId={historicoModal.transferenceId || null}
          isOpen={historicoModal.aberto}
          onClose={() => setHistoricoModal({ aberto: false })}
        />
      </main>
    </div>
  );
};

export default GestaoCd;
