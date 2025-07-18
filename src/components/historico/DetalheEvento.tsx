import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Package, User, DollarSign, ChevronLeft, ChevronRight, Package2, TrendingUp } from 'lucide-react';
import { EventoCalendario, PedidoConsolidado } from '@/hooks/useHistoricoConsolidado';
import ResumoProdutosDia from './ResumoProdutosDia';

interface DetalheEventoProps {
  evento: EventoCalendario | null;
  pedidosDoDia: PedidoConsolidado[];
  isOpen: boolean;
  onClose: () => void;
  onBuscarPedidosDoDiaComItens?: (data: string) => Promise<PedidoConsolidado[]>;
  onBuscarProdutosDoDia?: (data: string) => Promise<Array<{
    produto_nome: string;
    quantidade_total: number;
    pedidos_count: number;
    fornecedores: string[];
    preco_medio?: number;
    unidade?: string;
  }>>;
}

const DetalheEvento: React.FC<DetalheEventoProps> = ({ 
  evento, 
  pedidosDoDia: pedidosDoDiaProp, 
  isOpen, 
  onClose,
  onBuscarPedidosDoDiaComItens,
  onBuscarProdutosDoDia
}) => {
  const [pedidoAtualIndex, setPedidoAtualIndex] = useState(0);
  const [pedidosDoDia, setPedidosDoDia] = useState<PedidoConsolidado[]>([]);
  const [produtosDoDia, setProdutosDoDia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [activeTab, setActiveTab] = useState('produtos');

  useEffect(() => {
    if (evento && isOpen) {
      setLoading(true);
      setLoadingProdutos(true);
      
      // Buscar pedidos com itens
      if (onBuscarPedidosDoDiaComItens && evento.resource.dataCompleta) {
        onBuscarPedidosDoDiaComItens(evento.resource.dataCompleta).then((pedidos) => {
          setPedidosDoDia(pedidos);
          const pedidoClicado = evento.resource.pedidos[0];
          const indexPedidoClicado = pedidos.findIndex(p => p.id === pedidoClicado.id);
          setPedidoAtualIndex(indexPedidoClicado >= 0 ? indexPedidoClicado : 0);
          setLoading(false);
        }).catch(() => {
          setPedidosDoDia(pedidosDoDiaProp);
          setLoading(false);
        });
      } else {
        setPedidosDoDia(pedidosDoDiaProp);
        setLoading(false);
      }

      // Buscar produtos do dia
      if (onBuscarProdutosDoDia && evento.resource.dataCompleta) {
        onBuscarProdutosDoDia(evento.resource.dataCompleta).then((produtos) => {
          setProdutosDoDia(produtos);
          setLoadingProdutos(false);
        }).catch(() => {
          setLoadingProdutos(false);
        });
      } else {
        setLoadingProdutos(false);
      }
    }
  }, [evento, isOpen, pedidosDoDiaProp, onBuscarPedidosDoDiaComItens, onBuscarProdutosDoDia]);

  if (!evento) return null;

  const pedidoAtual = pedidosDoDia[pedidoAtualIndex];
  const temMultiplosPedidos = pedidosDoDia.length > 1;

  const proximoPedido = () => {
    setPedidoAtualIndex((prev) => (prev + 1) % pedidosDoDia.length);
  };

  const pedidoAnterior = () => {
    setPedidoAtualIndex((prev) => (prev - 1 + pedidosDoDia.length) % pedidosDoDia.length);
  };

  // Calcular estatísticas do dia
  const totalValorDia = pedidosDoDia.reduce((sum, p) => sum + p.valorTotal, 0);
  const totalItensDia = pedidosDoDia.reduce((sum, p) => sum + p.totalItens, 0);
  const fornecedoresDia = [...new Set(pedidosDoDia.map(p => p.fornecedor))];
  const tiposDia = [...new Set(pedidosDoDia.map(p => p.tipo))];

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando pedidos do dia...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pedidos de {new Date(evento.start).toLocaleDateString('pt-BR')}
            </div>
            {/* CORREÇÃO: Centralizar navegação para longe do botão fechar */}
            <div className="flex items-center justify-center flex-1">
              {temMultiplosPedidos && (
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pedidoAnterior}
                    disabled={pedidosDoDia.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                    {pedidoAtualIndex + 1} de {pedidosDoDia.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={proximoPedido}
                    disabled={pedidosDoDia.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="produtos">Produtos do Dia</TabsTrigger>
            <TabsTrigger value="pedido">Pedido Atual</TabsTrigger>
            <TabsTrigger value="todos">Todos os Pedidos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="produtos" className="mt-4">
            <ResumoProdutosDia 
              produtos={produtosDoDia}
              data={evento.resource.dataCompleta}
              loading={loadingProdutos}
              onVerPedido={(fornecedor) => {
                // FUNCIONALIDADE: Ver pedido específico do fornecedor
                const indicePedido = pedidosDoDia.findIndex(p => p.fornecedor === fornecedor);
                if (indicePedido >= 0) {
                  setPedidoAtualIndex(indicePedido);
                  setActiveTab('pedido');
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="pedido" className="mt-4">
            {pedidoAtual && (
              <div className="space-y-4">
                {/* Resumo do Pedido */}
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Pedido Atual</span>
                      {temMultiplosPedidos && (
                        <Badge variant="secondary">
                          {pedidoAtualIndex + 1} de {pedidosDoDia.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={pedidoAtual.tipo === 'cotacao' ? 'default' : 'secondary'}>
                              {pedidoAtual.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                            </Badge>
                            <span className="font-semibold">{pedidoAtual.fornecedor}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <User className="h-4 w-4 inline mr-1" />
                            {pedidoAtual.comprador} - {pedidoAtual.usuario_loja}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pedidoAtual.totalItens} itens • {new Date(pedidoAtual.data).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                          {pedidoAtual.observacoes && (
                            <p className="text-xs text-muted-foreground italic">
                              {pedidoAtual.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">
                          R$ {pedidoAtual.valorTotal.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Valor do Pedido</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Itens do Pedido */}
                {pedidoAtual.itens && pedidoAtual.itens.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package2 className="h-5 w-5" />
                        Itens do Pedido ({pedidoAtual.itens.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {pedidoAtual.itens.map((item, index) => (
                          <div 
                            key={index}
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.produto_nome}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.quantidade} {item.unidade || 'un'}
                                {item.tipo && ` • ${item.tipo}`}
                              </div>
                            </div>
                            {item.preco && (
                              <div className="text-right">
                                <div className="font-semibold text-green-600">
                                  R$ {item.preco.toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total: R$ {(item.preco * item.quantidade).toFixed(2)}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="todos" className="mt-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Todos os Pedidos do Dia</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pedidosDoDia.map((pedido, index) => (
                  <Card 
                    key={pedido.id} 
                    className={`cursor-pointer transition-colors ${
                      index === pedidoAtualIndex ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => {
                      // FUNCIONALIDADE: Click em pedido muda para aba atual automaticamente
                      setPedidoAtualIndex(index);
                      setActiveTab('pedido');
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={pedido.tipo === 'cotacao' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {pedido.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                            </Badge>
                            <span className="font-medium text-sm">{pedido.fornecedor}</span>
                            {index === pedidoAtualIndex && (
                              <Badge variant="default" className="text-xs">Atual</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pedido.comprador} • {pedido.totalItens} itens • {new Date(pedido.data).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            R$ {pedido.valorTotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default DetalheEvento;
