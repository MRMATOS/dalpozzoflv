import React from 'react';
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
  Plus,
  Scale,
  History,
  Settings,
  TrendingUp
} from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import CancelRecebimentoButton from '@/components/recebimento/CancelRecebimentoButton';

const RecebimentoDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  // Buscar recebimentos em andamento
  const { data: recebimentosAndamento } = useQuery({
    queryKey: ['recebimentos-andamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recebimentos')
        .select(`
          *,
          recebimentos_produtos(count)
        `)
        .eq('status', 'iniciado')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar estatísticas do dia
  const { data: estatisticasHoje } = useQuery({
    queryKey: ['estatisticas-recebimento-hoje'],
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('recebimentos')
        .select(`
          *,
          recebimentos_produtos(peso_liquido_kg)
        `)
        .gte('criado_em', `${hoje} 00:00:00`)
        .lte('criado_em', `${hoje} 23:59:59`);

      if (error) throw error;
      
      const finalizados = data?.filter(r => r.status === 'finalizado') || [];
      const totalPesoLiquido = finalizados.reduce((acc, r) => {
        const produtos = r.recebimentos_produtos as any[];
        return acc + produtos.reduce((sum, p) => sum + (p.peso_liquido_kg || 0), 0);
      }, 0);

      return {
        totalRecebimentos: data?.length || 0,
        finalizados: finalizados.length,
        emAndamento: data?.filter(r => r.status === 'iniciado').length || 0,
        totalPesoLiquido: totalPesoLiquido
      };
    },
  });

  // Buscar tipos de caixas para configuração
  const { data: tiposCaixas } = useQuery({
    queryKey: ['tipos-caixas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_caixas')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });

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
                <h1 className="text-lg font-semibold text-gray-900">Recebimento Físico</h1>
                <p className="text-sm text-gray-500">Centro de Distribuição - {profile?.nome}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/recebimento/novo')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Recebimento
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          {isMobile ? (
            <div className="space-y-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="configuracao">Configuração</TabsTrigger>
              </TabsList>
            </div>
          ) : (
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="configuracao">Configuração</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="dashboard" className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Recebimentos Hoje</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticasHoje?.totalRecebimentos || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {estatisticasHoje?.finalizados || 0} finalizados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {estatisticasHoje?.emAndamento || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando finalização
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Peso Recebido Hoje</CardTitle>
                  <Scale className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {(estatisticasHoje?.totalPesoLiquido || 0).toFixed(1)} kg
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Peso líquido total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tipos de Caixas</CardTitle>
                  <Package className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tiposCaixas?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Cadastrados no sistema
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recebimentos em Andamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Recebimentos em Andamento
                </CardTitle>
                <CardDescription>
                  Recebimentos que foram iniciados e ainda não foram finalizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recebimentosAndamento && recebimentosAndamento.length > 0 ? (
                  <div className="space-y-4">
                    {recebimentosAndamento.map((recebimento) => (
                      <div key={recebimento.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                              Em andamento
                            </Badge>
                            {recebimento.fornecedor && (
                              <span className="text-sm font-medium">{recebimento.fornecedor}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Iniciado em {new Date(recebimento.criado_em).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(recebimento.recebimentos_produtos as any[])?.[0]?.count || 0} produtos registrados
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            onClick={() => navigate(`/recebimento/${recebimento.id}`)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Continuar
                          </Button>
                          <CancelRecebimentoButton
                            recebimentoId={recebimento.id}
                            variant="outline"
                            onCancel={() => window.location.reload()}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum recebimento em andamento</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 border-blue-200"
                    onClick={() => navigate('/recebimento/novo')}
                  >
                    <Plus className="h-6 w-6 text-blue-600" />
                    <span className="text-blue-600">Novo Recebimento</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-gray-50"
                    onClick={() => navigate('/recebimento/historico')}
                  >
                    <History className="h-6 w-6 text-gray-600" />
                    <span className="text-gray-600">Histórico</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-green-50 border-green-200"
                    onClick={() => navigate('/estoque')}
                  >
                    <Package className="h-6 w-6 text-green-600" />
                    <span className="text-green-600">Ver Estoque</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuracao">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Tipos de Caixas e Embalagens
                </CardTitle>
                <CardDescription>
                  Gerencie os tipos de caixas e suas taras padrão para cálculo automático
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tiposCaixas?.map((tipo) => (
                    <div key={tipo.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{tipo.nome}</h4>
                        <p className="text-sm text-gray-500">{tipo.descricao}</p>
                        <p className="text-sm font-mono">Tara: {tipo.tara_kg} kg</p>
                      </div>
                      <Badge variant="outline">
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RecebimentoDashboard;
