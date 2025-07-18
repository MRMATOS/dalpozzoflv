
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BarChart3, List, Search, Filter, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useHistoricoConsolidado, EventoCalendario, PedidoConsolidado } from '@/hooks/useHistoricoConsolidado';
import { useHistoricoOtimizado } from '@/hooks/useHistoricoOtimizado';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import CalendarioView from '@/components/historico/CalendarioView';
import ListaPorProdutos from '@/components/historico/ListaPorProdutos';
import MetricasDashboard from '@/components/historico/MetricasDashboard';
import DetalheEvento from '@/components/historico/DetalheEvento';
import FiltrosAvancados from '@/components/historico/FiltrosAvancados';
import FiltroRapido from '@/components/historico/FiltroRapido';
import ExportacaoHistorico from '@/components/historico/ExportacaoHistorico';
import { CalendarioLoadingSkeleton, MetricasLoadingSkeleton, TabelaLoadingSkeleton } from '@/components/historico/LoadingStates';
import { TooltipHelper, AtalhosTeclado } from '@/components/historico/TooltipHelpers';
import { ResponsiveWrapper } from '@/components/historico/ResponsiveWrapper';
import { FadeInWrapper, StaggerContainer, StaggerItem, HoverCard } from '@/components/historico/AnimationUtils';

export default function HistoricoConsolidado() {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('calendario');
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [mostrarExportacao, setMostrarExportacao] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoCalendario | null>(null);
  const [pedidosDoDiaAtual, setPedidosDoDiaAtual] = useState<PedidoConsolidado[]>([]);
  const [textoBusca, setTextoBusca] = useState('');
  const [currentCalendarView, setCurrentCalendarView] = useState('month');
  const [modoLista, setModoLista] = useState<'fornecedor' | 'produtos'>('fornecedor');
  
  // CORREÇÃO: Sempre inicializar sem filtros para não persistir
  const [filtrosAtivos, setFiltrosAtivos] = useState({
    dataInicio: '',
    dataFim: '',
    comprador: '',
    fornecedor: '',
    tipo: undefined as 'cotacao' | 'simples' | undefined,
    valorMin: undefined as number | undefined,
    valorMax: undefined as number | undefined,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // CORREÇÃO: Controle mais rigoroso da inicialização
  const [inicializado, setInicializado] = useState(false);
  const [forceReload, setForceReload] = useState(0); // Para forçar reload limpo
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    pedidosConsolidados,
    eventosCalendario,
    metricas,
    compradores,
    loading,
    buscarDadosConsolidados,
    buscarPedidosDoDia,
    buscarPedidosDoDiaComItens,
    buscarProdutosDoDia,
    buscarPedidosDiaAdjacente
  } = useHistoricoConsolidado();

  const {
    dadosFiltrados,
    aplicarFiltros,
    ordenarDados,
    buscarTexto
  } = useHistoricoOtimizado();

  // CORREÇÃO: Inicialização sem filtros, sempre limpa
  useEffect(() => {
    console.log('Inicializando página HistoricoConsolidado...');
    
    // SEMPRE limpar tudo na inicialização
    const filtrosLimpos = {
      dataInicio: '',
      dataFim: '',
      comprador: '',
      fornecedor: '',
      tipo: undefined as 'cotacao' | 'simples' | undefined,
      valorMin: undefined as number | undefined,
      valorMax: undefined as number | undefined,
    };
    
    setFiltrosAtivos(filtrosLimpos);
    setTextoBusca('');
    setEventoSelecionado(null);
    setPedidosDoDiaAtual([]);
    setMostrarFiltrosAvancados(false);
    setMostrarExportacao(false);
    
    // Buscar dados sem filtros
    buscarDadosConsolidados(filtrosLimpos).then(() => {
      setInicializado(true);
      console.log('Dados iniciais carregados sem filtros');
    });
  }, [forceReload]); // Dependência do forceReload para garantir reload limpo

  // Aplicar filtros nos dados otimizados quando os dados consolidados mudarem
  useEffect(() => {
    if (pedidosConsolidados.length > 0 && inicializado) {
      console.log('Aplicando filtros nos dados consolidados:', pedidosConsolidados.length, 'pedidos');
      aplicarFiltros(filtrosAtivos, pedidosConsolidados);
    }
  }, [pedidosConsolidados, filtrosAtivos, aplicarFiltros, inicializado]);

  // Configurar atalhos de teclado
  useKeyboardShortcuts({
    onFilterQuick: (index) => {
      const periodos = ['hoje', 'semana', 'mes', 'trimestre'];
      if (periodos[index]) aplicarFiltroRapido(periodos[index]);
    },
    onExport: () => setMostrarExportacao(true),
    onSearch: () => searchInputRef.current?.focus(),
    onEscape: () => {
      setEventoSelecionado(null);
      setMostrarFiltrosAvancados(false);
      setMostrarExportacao(false);
    }
  });

  const aplicarFiltroRapido = async (periodo: string) => {
    setIsRefreshing(true);
    const hoje = new Date();
    let dataInicio = '';
    
    switch (periodo) {
      case 'hoje':
        dataInicio = hoje.toISOString().split('T')[0];
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - 7);
        dataInicio = inicioSemana.toISOString().split('T')[0];
        break;
      case 'mes':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataInicio = inicioMes.toISOString().split('T')[0];
        break;
      case 'trimestre':
        const inicioTrimestre = new Date(hoje.getFullYear(), Math.floor(hoje.getMonth() / 3) * 3, 1);
        dataInicio = inicioTrimestre.toISOString().split('T')[0];
        break;
    }
    
    const novosFiltros = { ...filtrosAtivos, dataInicio, dataFim: hoje.toISOString().split('T')[0] };
    setFiltrosAtivos(novosFiltros);
    await buscarDadosConsolidados(novosFiltros);
    setIsRefreshing(false);
  };

  const handleFiltroChange = (novosFiltros: typeof filtrosAtivos) => {
    console.log('Alterando filtros:', novosFiltros);
    setFiltrosAtivos(novosFiltros);
    buscarDadosConsolidados(novosFiltros);
  };

  // CORREÇÃO: Função de reload que limpa tudo
  const handleLimparFiltros = () => {
    console.log('Limpando filtros e recarregando dados...');
    setForceReload(prev => prev + 1); // Força reload completo
  };

  // CORREÇÃO: Função melhorada para lidar com clique em evento do calendário
  const handleEventClick = async (evento: EventoCalendario) => {
    setEventoSelecionado(evento);
    
    // Usar a data correta do evento para buscar pedidos
    const dataEvento = evento.resource.dataCompleta || evento.start.toISOString().split('T')[0];
    
    try {
      const pedidosDoDia = await buscarPedidosDoDiaComItens(dataEvento);
      setPedidosDoDiaAtual(pedidosDoDia);
      console.log(`Carregados ${pedidosDoDia.length} pedidos para ${dataEvento}:`, pedidosDoDia);
    } catch (error) {
      console.error('Erro ao buscar pedidos do dia:', error);
      setPedidosDoDiaAtual(evento.resource.pedidos);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <FadeInWrapper>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Histórico Consolidado</h1>
                <p className="text-muted-foreground">Análise completa de pedidos e cotações</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <TooltipHelper content="Recarregar dados sem filtros">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLimparFiltros} 
                  disabled={isRefreshing}
                >
                  {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </TooltipHelper>
              
              <Button variant="outline" size="sm" onClick={() => setMostrarFiltrosAvancados(!mostrarFiltrosAvancados)}>
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => setMostrarExportacao(!mostrarExportacao)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <FiltroRapido 
            filtros={filtrosAtivos}
            onFiltroChange={handleFiltroChange}
            onLimparFiltros={handleLimparFiltros}
          />

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar pedidos... (Ctrl+F)"
                value={textoBusca}
                onChange={(e) => {
                  setTextoBusca(e.target.value);
                  buscarTexto(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            {textoBusca && <Badge variant="secondary">{dadosFiltrados.length} resultado(s)</Badge>}
          </div>

          {mostrarFiltrosAvancados && (
            <FadeInWrapper>
              <Card>
                <CardHeader><CardTitle>Filtros Avançados</CardTitle></CardHeader>
                <CardContent>
                  <FiltrosAvancados
                    filtros={filtrosAtivos}
                    compradores={compradores}
                    onFiltrosChange={(novosFiltros) => {
                      setFiltrosAtivos({ ...filtrosAtivos, ...novosFiltros });
                    }}
                    onBuscar={async () => {
                      await buscarDadosConsolidados(filtrosAtivos);
                    }}
                    onLimpar={handleLimparFiltros}
                  />
                </CardContent>
              </Card>
            </FadeInWrapper>
          )}

          <ResponsiveWrapper
            activeTab={activeTab}
            onTabChange={setActiveTab}
            calendarioTab={loading ? <CalendarioLoadingSkeleton /> : (
              <CalendarioView 
                eventos={eventosCalendario} 
                onEventClick={handleEventClick} 
                currentView={currentCalendarView}
                onViewChange={setCurrentCalendarView}
              />
            )}
            metricasTab={loading ? <MetricasLoadingSkeleton /> : <MetricasDashboard metricas={metricas} />}
            listaTab={loading ? <TabelaLoadingSkeleton /> : (
              <div className="space-y-4">
                {/* Seletor de visualização */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Listar por:</span>
                        <div className="flex gap-1">
                          <Button
                            variant={modoLista === 'fornecedor' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setModoLista('fornecedor')}
                            className="h-8"
                          >
                            Fornecedor
                          </Button>
                          <Button
                            variant={modoLista === 'produtos' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setModoLista('produtos')}
                            className="h-8"
                          >
                            Produtos
                          </Button>
                        </div>
                      </div>
                      
                      <Badge variant="secondary" className="text-xs">
                        {modoLista === 'fornecedor' 
                          ? `${dadosFiltrados.length} pedidos`
                          : `Agrupados por produto`
                        }
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {dadosFiltrados.length === 0 ? (
                  <Card><CardContent className="p-8 text-center">
                    <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-muted-foreground">Tente ajustar os filtros ou o período de busca</p>
                  </CardContent></Card>
                ) : modoLista === 'produtos' ? (
                  <ListaPorProdutos 
                    pedidos={dadosFiltrados}
                    onPedidoClick={(pedido) => handleEventClick({
                      id: pedido.id,
                      title: `${pedido.fornecedor} - R$ ${pedido.valorTotal.toFixed(2)}`,
                      start: new Date(pedido.data),
                      end: new Date(pedido.data),
                      resource: {
                        pedidos: [pedido],
                        totalValor: pedido.valorTotal,
                        totalItens: pedido.totalItens,
                        tipos: [pedido.tipo],
                        fornecedores: [pedido.fornecedor],
                        dataCompleta: pedido.data.split('T')[0]
                      }
                    })}
                    loading={loading}
                  />
                ) : (
                  <StaggerContainer className="space-y-2">
                    {dadosFiltrados.map((pedido) => (
                      <StaggerItem key={pedido.id}>
                        <HoverCard className="cursor-pointer" onClick={() => handleEventClick({ 
                          id: pedido.id,
                          title: `${pedido.fornecedor} - R$ ${pedido.valorTotal.toFixed(2)}`,
                          start: new Date(pedido.data),
                          end: new Date(pedido.data),
                          resource: {
                            pedidos: [pedido],
                            totalValor: pedido.valorTotal,
                            totalItens: pedido.totalItens,
                            tipos: [pedido.tipo],
                            fornecedores: [pedido.fornecedor],
                            dataCompleta: pedido.data.split('T')[0]
                          }
                        })}>
                          <Card><CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={pedido.tipo === 'cotacao' ? 'default' : 'secondary'} className="text-xs">
                                    {pedido.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                                  </Badge>
                                  <span className="font-medium truncate">{pedido.fornecedor}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {pedido.comprador} • {pedido.usuario_loja} • {pedido.totalItens} itens
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(pedido.data).toLocaleString('pt-BR')}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">
                                  R$ {pedido.valorTotal.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </CardContent></Card>
                        </HoverCard>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </div>
            )}
          />
        </div>
      </FadeInWrapper>

      {eventoSelecionado && (
        <DetalheEvento 
          evento={eventoSelecionado} 
          pedidosDoDia={pedidosDoDiaAtual}
          isOpen={true} 
          onClose={() => {
            setEventoSelecionado(null);
            setPedidosDoDiaAtual([]);
          }}
          onBuscarPedidosDoDiaComItens={buscarPedidosDoDiaComItens}
          onBuscarProdutosDoDia={buscarProdutosDoDia}
          onBuscarPedidosDiaAdjacente={buscarPedidosDiaAdjacente}
        />
      )}
      
      {mostrarExportacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Exportar Dados</h3>
            <ExportacaoHistorico dados={dadosFiltrados} filtrosAtivos="Filtros aplicados" />
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setMostrarExportacao(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
      <AtalhosTeclado />
    </div>
  );
}
