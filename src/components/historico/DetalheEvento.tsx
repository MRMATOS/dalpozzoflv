
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Package, User, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { EventoCalendario, PedidoConsolidado } from '@/hooks/useHistoricoConsolidado';

interface DetalheEventoProps {
  evento: EventoCalendario | null;
  pedidosDoDia: PedidoConsolidado[];
  isOpen: boolean;
  onClose: () => void;
  onBuscarPedidosDoDia?: (data: string) => Promise<PedidoConsolidado[]>;
}

const DetalheEvento: React.FC<DetalheEventoProps> = ({ 
  evento, 
  pedidosDoDia: pedidosDoDiaProp, 
  isOpen, 
  onClose,
  onBuscarPedidosDoDia 
}) => {
  const [pedidoAtualIndex, setPedidoAtualIndex] = useState(0);
  const [pedidosDoDia, setPedidosDoDia] = useState<PedidoConsolidado[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (evento && isOpen) {
      // Se já temos os pedidos do dia como prop, usar eles
      if (pedidosDoDiaProp && pedidosDoDiaProp.length > 0) {
        setPedidosDoDia(pedidosDoDiaProp);
        // Encontrar o índice do pedido clicado
        const pedidoClicado = evento.resource.pedidos[0];
        const indexPedidoClicado = pedidosDoDiaProp.findIndex(p => p.id === pedidoClicado.id);
        setPedidoAtualIndex(indexPedidoClicado >= 0 ? indexPedidoClicado : 0);
      } 
      // Senão, buscar pedidos do dia se temos a função
      else if (onBuscarPedidosDoDia && evento.resource.dataCompleta) {
        setLoading(true);
        onBuscarPedidosDoDia(evento.resource.dataCompleta).then((pedidos) => {
          setPedidosDoDia(pedidos);
          // Encontrar o índice do pedido clicado
          const pedidoClicado = evento.resource.pedidos[0];
          const indexPedidoClicado = pedidos.findIndex(p => p.id === pedidoClicado.id);
          setPedidoAtualIndex(indexPedidoClicado >= 0 ? indexPedidoClicado : 0);
          setLoading(false);
        }).catch(() => {
          setLoading(false);
        });
      }
      // Fallback: usar apenas o pedido do evento
      else {
        setPedidosDoDia(evento.resource.pedidos);
        setPedidoAtualIndex(0);
      }
    }
  }, [evento, isOpen, pedidosDoDiaProp, onBuscarPedidosDoDia]);

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
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Pedidos de {new Date(evento.start).toLocaleDateString('pt-BR')}
            </div>
            {temMultiplosPedidos && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pedidoAnterior}
                  disabled={pedidosDoDia.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {pedidoAtualIndex + 1} de {pedidosDoDia.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={proximoPedido}
                  disabled={pedidosDoDia.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo do Dia */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{pedidosDoDia.length}</div>
              <div className="text-sm text-muted-foreground">Pedidos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">R$ {totalValorDia.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{fornecedoresDia.length}</div>
              <div className="text-sm text-muted-foreground">Fornecedores</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{totalItensDia}</div>
              <div className="text-sm text-muted-foreground">Total de Itens</div>
            </CardContent>
          </Card>
        </div>

        {/* Destaque do Pedido Atual */}
        {pedidoAtual && (
          <Card className="mb-6 border-primary/50">
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
        )}

        {/* Lista de Todos os Pedidos do Dia (se houver mais de um) */}
        {temMultiplosPedidos && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Todos os Pedidos do Dia</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pedidosDoDia.map((pedido, index) => (
                <Card 
                  key={pedido.id} 
                  className={`cursor-pointer transition-colors ${
                    index === pedidoAtualIndex ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setPedidoAtualIndex(index)}
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
        )}

        {/* Resumo Final */}
        {pedidosDoDia.length > 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                Média por Pedido: R$ {(totalValorDia / pedidosDoDia.length).toFixed(2)}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {fornecedoresDia.length} fornecedor{fornecedoresDia.length > 1 ? 'es' : ''} • {tiposDia.length} tipo{tiposDia.length > 1 ? 's' : ''} de pedido
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetalheEvento;
