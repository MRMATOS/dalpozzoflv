
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AlertCircle
} from "lucide-react";

const GestaoCd = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // Buscar resumo das requisições por loja
  const { data: resumoRequisicoes } = useQuery({
    queryKey: ['resumo-requisicoes-cd'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisicoes')
        .select(`
          id,
          loja,
          status,
          data_requisicao,
          itens_requisicao(
            quantidade,
            quantidade_calculada
          )
        `)
        .order('data_requisicao', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar transferências pendentes
  const { data: transferenciasPendentes } = useQuery({
    queryKey: ['transferencias-pendentes-cd'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias')
        .select(`
          id,
          loja_origem,
          loja_destino,
          quantidade_requisitada,
          status,
          criado_em,
          produtos(produto)
        `)
        .eq('status', 'pendente')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calcular estatísticas
  const estatisticas = React.useMemo(() => {
    if (!resumoRequisicoes) return null;

    const totalRequisicoes = resumoRequisicoes.length;
    const pendentes = resumoRequisicoes.filter(req => req.status === 'pendente').length;
    const processando = resumoRequisicoes.filter(req => req.status === 'processando').length;
    const finalizadas = resumoRequisicoes.filter(req => req.status === 'finalizada').length;

    // Agrupar por loja
    const porLoja = resumoRequisicoes.reduce((acc, req) => {
      if (!acc[req.loja]) {
        acc[req.loja] = { total: 0, pendentes: 0, itens: 0 };
      }
      acc[req.loja].total += 1;
      if (req.status === 'pendente') {
        acc[req.loja].pendentes += 1;
      }
      acc[req.loja].itens += (req.itens_requisicao as any[]).length;
      return acc;
    }, {} as Record<string, any>);

    return {
      totalRequisicoes,
      pendentes,
      processando,
      finalizadas,
      porLoja
    };
  }, [resumoRequisicoes]);

  const totalTransferenciasPendentes = transferenciasPendentes?.length || 0;

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
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requisições</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas?.totalRequisicoes || 0}</div>
              <p className="text-xs text-muted-foreground">Todas as requisições</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{estatisticas?.pendentes || 0}</div>
              <p className="text-xs text-muted-foreground">Aguardando processamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transferências</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalTransferenciasPendentes}</div>
              <p className="text-xs text-muted-foreground">Aguardando envio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{estatisticas?.finalizadas || 0}</div>
              <p className="text-xs text-muted-foreground">Concluídas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Resumo por Loja */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Requisições por Loja
              </CardTitle>
              <CardDescription>Resumo das requisições de cada loja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {estatisticas?.porLoja ? Object.entries(estatisticas.porLoja).map(([loja, dados]: [string, any]) => (
                  <div key={loja} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{loja}</p>
                      <p className="text-sm text-gray-500">{dados.itens} produtos requisitados</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{dados.total} total</Badge>
                      {dados.pendentes > 0 && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {dados.pendentes} pendentes
                        </Badge>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma requisição encontrada</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transferências Pendentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Transferências Pendentes
              </CardTitle>
              <CardDescription>Produtos aguardando transferência</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transferenciasPendentes && transferenciasPendentes.length > 0 ? (
                  transferenciasPendentes.slice(0, 10).map((transferencia) => (
                    <div key={transferencia.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {(transferencia.produtos as any)?.produto || 'Produto não identificado'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transferencia.loja_origem} → {transferencia.loja_destino}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transferencia.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{transferencia.quantidade_requisitada}kg</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Nenhuma transferência pendente</p>
                )}
              </div>

              {transferenciasPendentes && transferenciasPendentes.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/transferencias')}
                  >
                    Ver Todas as Transferências
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesso rápido às principais funcionalidades do CD</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/transferencias')}
                >
                  <Truck className="h-6 w-6" />
                  <span>Gerenciar Transferências</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/historico-requisicoes')}
                >
                  <Package className="h-6 w-6" />
                  <span>Histórico de Requisições</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2"
                  onClick={() => navigate('/configuracoes')}
                  disabled={!profile || profile.tipo !== 'master'}
                >
                  <Store className="h-6 w-6" />
                  <span>Configurações</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default GestaoCd;
