
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventoCalendario } from '@/hooks/useHistoricoConsolidado';
import { Calendar, Package, TrendingUp, User } from 'lucide-react';

interface DetalheEventoProps {
  evento: EventoCalendario | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetalheEvento: React.FC<DetalheEventoProps> = ({ evento, isOpen, onClose }) => {
  if (!evento) return null;

  const { resource } = evento;
  const dataFormatada = evento.start.toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Agrupar pedidos por fornecedor
  const pedidosPorFornecedor = resource.pedidos.reduce((acc, pedido) => {
    if (!acc[pedido.fornecedor_nome]) {
      acc[pedido.fornecedor_nome] = [];
    }
    acc[pedido.fornecedor_nome].push(pedido);
    return acc;
  }, {} as Record<string, typeof resource.pedidos>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pedidos do dia {dataFormatada}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo do Dia */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{resource.pedidos.length}</div>
                <div className="text-sm text-gray-600">Total de Pedidos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {resource.totalValor.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{resource.totalItens}</div>
                <div className="text-sm text-gray-600">Total de Itens</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{resource.fornecedores.length}</div>
                <div className="text-sm text-gray-600">Fornecedores</div>
              </CardContent>
            </Card>
          </div>

          {/* Tipos de Pedidos */}
          <div className="flex gap-2">
            {resource.tipos.map((tipo) => (
              <Badge key={tipo} variant={tipo === 'cotacao' ? 'default' : 'secondary'}>
                {tipo === 'cotacao' ? 'Cotação' : 'Simples'}
              </Badge>
            ))}
          </div>

          {/* Pedidos por Fornecedor */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalhes por Fornecedor</h3>
            {Object.entries(pedidosPorFornecedor).map(([fornecedor, pedidos]) => (
              <Card key={fornecedor}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {fornecedor}
                    <Badge variant="outline">{pedidos.length} pedidos</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pedidos.map((pedido) => (
                      <div key={pedido.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={pedido.tipo === 'cotacao' ? 'default' : 'secondary'}>
                              {pedido.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                            </Badge>
                            <span className="text-sm text-gray-600 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {pedido.usuario_nome} - {pedido.usuario_loja}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {pedido.quantidade_itens} itens • {pedido.data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {pedido.observacoes && (
                            <div className="text-xs text-gray-500 mt-1 italic">
                              {pedido.observacoes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            R$ {pedido.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Subtotal por fornecedor */}
                    <div className="border-t pt-2 flex justify-between items-center font-semibold">
                      <span>Subtotal {fornecedor}:</span>
                      <span className="text-green-600">
                        R$ {pedidos.reduce((sum, p) => sum + p.total, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetalheEvento;
