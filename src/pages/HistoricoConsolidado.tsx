
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, List } from 'lucide-react';
import { useHistoricoConsolidado, FiltrosHistorico } from '@/hooks/useHistoricoConsolidado';
import FiltrosAvancados from '@/components/historico/FiltrosAvancados';

const HistoricoConsolidado = () => {
  const navigate = useNavigate();
  const {
    pedidosConsolidados,
    eventosCalendario,
    metricas,
    compradores,
    loading,
    buscarDadosConsolidados,
    isComprador,
    isMaster
  } = useHistoricoConsolidado();

  const [filtros, setFiltros] = useState<FiltrosHistorico>({
    dataInicio: '',
    dataFim: '',
    comprador: 'meus',
    fornecedor: '',
    produto: '',
    tipoPedido: 'todos'
  });

  // Buscar dados iniciais
  useEffect(() => {
    // Definir período padrão (últimos 30 dias)
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);
    
    const filtrosIniciais = {
      ...filtros,
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    };
    
    setFiltros(filtrosIniciais);
    buscarDadosConsolidados(filtrosIniciais);
  }, []);

  const handleBuscar = () => {
    buscarDadosConsolidados(filtros);
  };

  const handleLimparFiltros = () => {
    const hoje = new Date();
    const inicio = new Date();
    inicio.setDate(hoje.getDate() - 30);
    
    const filtrosLimpos = {
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0],
      comprador: 'meus',
      fornecedor: '',
      produto: '',
      tipoPedido: 'todos' as const
    };
    
    setFiltros(filtrosLimpos);
    buscarDadosConsolidados(filtrosLimpos);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Histórico Consolidado de Pedidos</h1>
                <p className="text-sm text-gray-500">Visão completa e métricas dos seus pedidos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FiltrosAvancados
          filtros={filtros}
          onFiltrosChange={setFiltros}
          onBuscar={handleBuscar}
          onLimpar={handleLimparFiltros}
          compradores={compradores}
          isComprador={isComprador}
          isMaster={isMaster}
        />

        <Tabs defaultValue="consolidado" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consolidado" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Visão Consolidada</span>
            </TabsTrigger>
            <TabsTrigger value="tradicional" className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>Visualização Tradicional</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consolidado" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando dados consolidados...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Resumo Rápido */}
                {metricas && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-blue-600">{metricas.totalPedidos}</div>
                        <div className="text-sm text-gray-600">Total de Pedidos</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-green-600">
                          R$ {metricas.totalValor.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Valor Total</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-purple-600">{metricas.totalItens}</div>
                        <div className="text-sm text-gray-600">Total de Itens</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-2xl font-bold text-orange-600">
                          {metricas.fornecedoresMaisAcionados.length}
                        </div>
                        <div className="text-sm text-gray-600">Fornecedores Únicos</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Placeholder para o Calendário (será implementado na próxima fase) */}
                <Card>
                  <CardHeader>
                    <CardTitle>Calendário de Pedidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Calendário será implementado na próxima fase</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {eventosCalendario.length} eventos encontrados no período
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Métricas em formato de cards */}
                {metricas && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fornecedores Mais Acionados */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Fornecedores Mais Acionados</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {metricas.fornecedoresMaisAcionados.slice(0, 8).map((fornecedor, index) => (
                            <div key={fornecedor.nome} className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium">{fornecedor.nome}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{fornecedor.pedidos} pedidos</div>
                                <div className="text-xs text-gray-500">R$ {fornecedor.valor.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Estatísticas por Comprador */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Estatísticas por Comprador</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {metricas.compradorEstatisticas.slice(0, 8).map((comprador, index) => (
                            <div key={comprador.nome} className="flex justify-between items-center">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </div>
                                <span className="text-sm font-medium">{comprador.nome}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">{comprador.pedidos} pedidos</div>
                                <div className="text-xs text-gray-500">R$ {comprador.valor.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tradicional" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando lista tradicional...</p>
              </div>
            ) : pedidosConsolidados.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <List className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros ou ampliar o período de busca.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Encontrados {pedidosConsolidados.length} pedidos
                  </p>
                </div>
                {pedidosConsolidados.map((pedido) => (
                  <Card key={pedido.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{pedido.fornecedor_nome}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              pedido.tipo === 'cotacao' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {pedido.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                            </span>
                            {(isComprador || isMaster) && filtros.comprador !== 'meus' && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {pedido.usuario_nome} - {pedido.usuario_loja}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-medium">Itens:</span> {pedido.quantidade_itens}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> R$ {pedido.total.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Data:</span> {pedido.data.toLocaleDateString('pt-BR')}
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <span className="font-medium">Hora:</span> {pedido.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {pedido.observacoes && (
                            <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                              <strong>Observações:</strong> {pedido.observacoes}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HistoricoConsolidado;
