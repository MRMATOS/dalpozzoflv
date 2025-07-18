
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, List, BarChart3 } from 'lucide-react';
import { useHistoricoConsolidado, FiltrosHistorico, EventoCalendario } from '@/hooks/useHistoricoConsolidado';
import FiltrosAvancados from '@/components/historico/FiltrosAvancados';
import CalendarioView from '@/components/historico/CalendarioView';
import DetalheEvento from '@/components/historico/DetalheEvento';
import MetricasDashboard from '@/components/historico/MetricasDashboard';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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
    tipo: undefined
  });

  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null);
  const [detalheAberto, setDetalheAberto] = useState(false);

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

  const handleEventClick = (evento: EventoCalendario) => {
    setEventoSelecionado(evento);
    setDetalheAberto(true);
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

        <Tabs defaultValue="calendario" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendario" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="metricas" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Métricas</span>
            </TabsTrigger>
            <TabsTrigger value="tradicional" className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>Lista</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendario" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando calendário...</p>
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
                          R$ {metricas.valorTotal.toFixed(2)}
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
                          {eventosCalendario.length}
                        </div>
                        <div className="text-sm text-gray-600">Dias com Pedidos</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Calendário */}
                <CalendarioView 
                  eventos={eventosCalendario} 
                  onEventClick={handleEventClick}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="metricas" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando métricas...</p>
              </div>
            ) : metricas ? (
              <MetricasDashboard metricas={metricas} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum dado encontrado</h2>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros ou ampliar o período de busca.
                  </p>
                </CardContent>
              </Card>
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
                            <h3 className="font-semibold text-gray-900">{pedido.fornecedor}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              pedido.tipo === 'cotacao' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {pedido.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                            </span>
                            {(isComprador || isMaster) && filtros.comprador !== 'meus' && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {pedido.comprador} - {pedido.usuario_loja}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                            <div>
                              <span className="font-medium">Itens:</span> {pedido.totalItens}
                            </div>
                            <div>
                              <span className="font-medium">Total:</span> R$ {pedido.valorTotal.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Data:</span> {new Date(pedido.data).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="col-span-2 md:col-span-1">
                              <span className="font-medium">Hora:</span> {new Date(pedido.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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

        {/* Modal de Detalhes do Evento */}
        <DetalheEvento 
          evento={eventoSelecionado}
          isOpen={detalheAberto}
          onClose={() => setDetalheAberto(false)}
        />
      </main>
    </div>
  );
};

export default HistoricoConsolidado;
