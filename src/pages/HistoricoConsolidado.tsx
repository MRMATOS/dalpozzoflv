import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BarChart3, List, Search, Filter, Download, RefreshCw } from 'lucide-react';

import { useHistoricoConsolidado } from '@/hooks/useHistoricoConsolidado';
import { useHistoricoOtimizado } from '@/hooks/useHistoricoOtimizado';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import CalendarioView from '@/components/historico/CalendarioView';
import MetricasDashboard from '@/components/historico/MetricasDashboard';
import DetalheEvento from '@/components/historico/DetalheEvento';
import FiltrosAvancados from '@/components/historico/FiltrosAvancados';
import ExportacaoHistorico from '@/components/historico/ExportacaoHistorico';
import { CalendarioLoadingSkeleton, MetricasLoadingSkeleton, TabelaLoadingSkeleton } from '@/components/historico/LoadingStates';
import { TooltipHelper, AtalhosTeclado } from '@/components/historico/TooltipHelpers';
import { ResponsiveWrapper } from '@/components/historico/ResponsiveWrapper';
import { FadeInWrapper, StaggerContainer, StaggerItem, HoverCard } from '@/components/historico/AnimationUtils';

export default function HistoricoConsolidado() {
  const [activeTab, setActiveTab] = useState('calendario');
  const [mostrarFiltrosAvancados, setMostrarFiltrosAvancados] = useState(false);
  const [mostrarExportacao, setMostrarExportacao] = useState(false);
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [textoBusca, setTextoBusca] = useState('');
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
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    dadosConsolidados,
    eventosCalendario,
    metricas,
    compradores,
    carregando,
    buscarDadosConsolidados
  } = useHistoricoConsolidado();

  const {
    dadosFiltrados,
    filtrandoStatus,
    aplicarFiltros,
    ordenarDados,
    buscarTexto
  } = useHistoricoOtimizado();

  // Carregar dados iniciais
  useEffect(() => {
    const filtrosIniciais = {
      dataInicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      dataFim: new Date().toISOString().split('T')[0]
    };
    setFiltrosAtivos(filtrosIniciais);
    buscarDadosConsolidados(filtrosIniciais);
  }, []);

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

  return (
    <div className="min-h-screen bg-background">
      <FadeInWrapper>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Histórico Consolidado</h1>
              <p className="text-muted-foreground">Análise completa de pedidos e cotações</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <TooltipHelper content="Atualizar dados">
                <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido('mes')} disabled={isRefreshing}>
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

          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['hoje', 'semana', 'mes', 'trimestre'].map((periodo, index) => (
              <StaggerItem key={periodo}>
                <Button variant="outline" size="sm" onClick={() => aplicarFiltroRapido(periodo)} className="w-full capitalize" disabled={isRefreshing}>
                  {periodo}
                </Button>
              </StaggerItem>
            ))}
          </StaggerContainer>

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
                    onFiltrosChange={async (novosFiltros) => {
                      setFiltrosAtivos(novosFiltros);
                      await buscarDadosConsolidados(novosFiltros);
                    }}
                  />
                </CardContent>
              </Card>
            </FadeInWrapper>
          )}

          <ResponsiveWrapper
            activeTab={activeTab}
            onTabChange={setActiveTab}
            calendarioTab={carregando ? <CalendarioLoadingSkeleton /> : <CalendarioView eventos={eventosCalendario} onEventoClick={setEventoSelecionado} />}
            metricasTab={carregando ? <MetricasLoadingSkeleton /> : <MetricasDashboard metricas={metricas} />}
            listaTab={carregando ? <TabelaLoadingSkeleton /> : (
              <div className="space-y-4">
                {dadosFiltrados.length === 0 ? (
                  <Card><CardContent className="p-8 text-center">
                    <List className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-muted-foreground">Tente ajustar os filtros ou o período de busca</p>
                  </CardContent></Card>
                ) : (
                  <StaggerContainer className="space-y-2">
                    {dadosFiltrados.map((pedido) => (
                      <StaggerItem key={pedido.id}>
                        <HoverCard className="cursor-pointer" onClick={() => setEventoSelecionado({ pedidos: [pedido] })}>
                          <Card><CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant={pedido.tipo === 'cotacao' ? 'default' : 'secondary'}>{pedido.tipo}</Badge>
                                  <span className="font-medium">{pedido.fornecedor}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Comprador: {pedido.comprador}</p>
                                <p className="text-sm text-muted-foreground">{pedido.totalItens} itens • {new Date(pedido.data).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">R$ {pedido.valorTotal.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">{new Date(pedido.data).toLocaleDateString()}</div>
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

      {eventoSelecionado && <DetalheEvento evento={eventoSelecionado} onClose={() => setEventoSelecionado(null)} />}
      {mostrarExportacao && <ExportacaoHistorico dados={dadosFiltrados} onClose={() => setMostrarExportacao(false)} />}
      <AtalhosTeclado />
    </div>
  );
}