import React, { useState } from 'react';
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
  Calendar, 
  CheckCircle, 
  Scale,
  Clock,
  Users,
  MapPin,
  User,
  Timer
} from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';

interface RecebimentoDetalhado {
  id: string;
  criado_em: string;
  finalizado_em: string | null;
  fornecedor: string | null;
  origem: string | null;
  modo_pesagem: string | null;
  quantidade_pallets_informada: number | null;
  peso_total_informado: number | null;
  peso_medio_calculado: number | null;
  total_peso_bruto: number | null;
  total_peso_liquido: number | null;
  total_produtos: number | null;
  observacoes: string | null;
  recebimentos_produtos: any[];
  recebimentos_pallets: any[];
}

const HistoricoRecebimentos = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [recebimentoSelecionado, setRecebimentoSelecionado] = useState<RecebimentoDetalhado | null>(null);
  const [pallets, setPallets] = useState<any[]>([]);

  // Buscar histórico de recebimentos
  const { data: recebimentos, isLoading } = useQuery({
    queryKey: ['historico-recebimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recebimentos')
        .select(`
          *,
          recebimentos_produtos(
            id,
            produto_nome,
            peso_liquido_kg,
            peso_bruto_kg,
            quantidade_caixas,
            loja_destino,
            tipo_caixa_nome,
            pallets_utilizados,
            tara_caixas_kg,
            tara_pallets_kg
          )
        `)
        .eq('status', 'finalizado')
        .order('finalizado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar pallets do recebimento selecionado
  const buscarPallets = async (recebimentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('recebimentos_pallets')
        .select('*')
        .eq('recebimento_id', recebimentoId)
        .order('ordem', { ascending: true });

      if (error) throw error;
      setPallets(data || []);
    } catch (error) {
      console.error('Erro ao buscar pallets:', error);
    }
  };

  const selecionarRecebimento = (recebimento: any) => {
    setRecebimentoSelecionado(recebimento);
    buscarPallets(recebimento.id);
  };

  const voltarParaLista = () => {
    setRecebimentoSelecionado(null);
    setPallets([]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatPeso = (peso: number) => {
    return `${peso.toFixed(1)} kg`;
  };

  const getTotalProdutos = (produtos: any[]) => {
    return produtos?.length || 0;
  };

  const getTotalPeso = (produtos: any[]) => {
    return produtos?.reduce((acc, p) => acc + (p.peso_liquido_kg || 0), 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  // Visualização detalhada do recebimento
  if (recebimentoSelecionado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={voltarParaLista}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Recebimento - {recebimentoSelecionado.fornecedor || 'Fornecedor'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Finalizado em {formatDate(recebimentoSelecionado.finalizado_em!)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="text-blue-600" />
                Informações do Recebimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Fornecedor</div>
                  <div className="font-medium">{recebimentoSelecionado.fornecedor || 'Não informado'}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Origem</div>
                  <div className="font-medium">{recebimentoSelecionado.origem || 'Não informado'}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Modo de Pesagem
                  </div>
                  <Badge variant={recebimentoSelecionado.modo_pesagem === 'media' ? 'default' : 'secondary'}>
                    {recebimentoSelecionado.modo_pesagem === 'media' ? 'Pesagem por Média' : 'Pesagem Individual'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <Timer className="h-4 w-4" />
                    Iniciado em
                  </div>
                  <div className="font-medium">{formatDate(recebimentoSelecionado.criado_em)}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Finalizado em
                  </div>
                  <div className="font-medium">{formatDate(recebimentoSelecionado.finalizado_em!)}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-gray-600">Status</div>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Finalizado
                  </Badge>
                </div>
              </div>

              {recebimentoSelecionado.observacoes && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Observações</div>
                  <div className="text-sm">{recebimentoSelecionado.observacoes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações dos Pallets */}
          {recebimentoSelecionado.modo_pesagem === 'media' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Users className="text-purple-600" />
                  Pallets - Modo Pesagem por Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Quantidade de Pallets</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {recebimentoSelecionado.quantidade_pallets_informada}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">Peso Total Informado</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPeso(recebimentoSelecionado.peso_total_informado || 0)}
                    </div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm text-gray-600">Peso Médio Calculado</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {formatPeso(recebimentoSelecionado.peso_medio_calculado || 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Scale className="text-green-600" />
                  Pallets Registrados ({pallets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pallets.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pallets.map((pallet) => (
                      <div key={pallet.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">Pallet {pallet.ordem}</Badge>
                          <span className="font-mono text-lg font-semibold">
                            {formatPeso(pallet.peso_kg)}
                          </span>
                        </div>
                        {pallet.observacoes && (
                          <p className="text-sm text-gray-500">{pallet.observacoes}</p>
                        )}
                        <div className="text-xs text-gray-400 mt-2">
                          {new Date(pallet.registrado_em).toLocaleTimeString('pt-BR')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Nenhum pallet registrado
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Produtos Recebidos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="text-indigo-600" />
                Produtos Recebidos ({recebimentoSelecionado.recebimentos_produtos?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recebimentoSelecionado.recebimentos_produtos?.length > 0 ? (
                <div className="space-y-4">
                  {recebimentoSelecionado.recebimentos_produtos.map((produto, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">{produto.produto_nome}</h3>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Loja Destino:</span>
                              <div className="font-medium flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {produto.loja_destino}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600">Quantidade:</span>
                              <div className="font-medium">{produto.quantidade_caixas || 0} caixas</div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600">Peso Bruto:</span>
                              <div className="font-medium">{formatPeso(produto.peso_bruto_kg)}</div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600">Peso Líquido:</span>
                              <div className="font-medium text-green-600">{formatPeso(produto.peso_liquido_kg)}</div>
                            </div>
                          </div>

                          {produto.tipo_caixa_nome && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">Tipo de Caixa: </span>
                              <Badge variant="secondary">{produto.tipo_caixa_nome}</Badge>
                            </div>
                          )}

                          {produto.pallets_utilizados && produto.pallets_utilizados.length > 0 && (
                            <div className="mt-2">
                              <span className="text-sm text-gray-600">Pallets utilizados: </span>
                              <div className="flex gap-1 mt-1">
                                {produto.pallets_utilizados.map((palletNum: number) => (
                                  <Badge key={palletNum} variant="outline" className="text-xs">
                                    P{palletNum}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Nenhum produto registrado
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totalizadores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Scale className="text-purple-600" />
                Resumo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Total de Produtos</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {recebimentoSelecionado.total_produtos || 0}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Peso Total Bruto</div>
                  <div className="text-3xl font-bold text-gray-600">
                    {formatPeso(recebimentoSelecionado.total_peso_bruto || 0)}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Peso Total Líquido</div>
                  <div className="text-3xl font-bold text-green-600">
                    {formatPeso(recebimentoSelecionado.total_peso_liquido || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Lista de recebimentos
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
                onClick={() => navigate('/recebimento')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              {!isMobile && (
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Histórico de Recebimentos</h1>
                  <p className="text-sm text-gray-500">Centro de Distribuição - {profile?.nome}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Título mobile */}
      {isMobile && (
        <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-semibold text-gray-900">Histórico de Recebimentos</h1>
            <p className="text-sm text-gray-600">Recebimentos finalizados</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Recebimentos Finalizados
            </CardTitle>
            <CardDescription>
              Histórico dos últimos 50 recebimentos finalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recebimentos && recebimentos.length > 0 ? (
              <div className="space-y-4">
                {recebimentos.map((recebimento) => (
                  <div 
                    key={recebimento.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => selecionarRecebimento(recebimento)}
                  >
                    <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
                      <div className="flex-1">
                        <div className={`flex items-center ${isMobile ? 'justify-between mb-2' : 'space-x-3 mb-2'}`}>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Finalizado
                          </Badge>
                          {recebimento.fornecedor && (
                            <span className="text-sm font-medium text-gray-700">
                              {recebimento.fornecedor}
                            </span>
                          )}
                          {recebimento.modo_pesagem === 'media' && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Média
                            </Badge>
                          )}
                        </div>
                        
                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'}`}>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(recebimento.finalizado_em)}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Package className="h-4 w-4 mr-1" />
                            {getTotalProdutos(recebimento.recebimentos_produtos)} produtos
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Scale className="h-4 w-4 mr-1" />
                            {formatPeso(getTotalPeso(recebimento.recebimentos_produtos))}
                          </div>
                        </div>

                        {recebimento.origem && (
                          <p className="text-xs text-gray-500 mt-2">
                            Origem: {recebimento.origem}
                          </p>
                        )}
                        
                        {recebimento.observacoes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Obs: {recebimento.observacoes}
                          </p>
                        )}
                      </div>
                      
                      {!isMobile && (
                        <div className="flex items-center space-x-2 ml-4">
                          <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum recebimento encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Ainda não há recebimentos finalizados no sistema.
                </p>
                <Button onClick={() => navigate('/recebimento/novo')}>
                  Iniciar Primeiro Recebimento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HistoricoRecebimentos;