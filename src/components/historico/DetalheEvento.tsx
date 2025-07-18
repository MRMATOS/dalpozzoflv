import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, User, DollarSign } from 'lucide-react';
import { EventoCalendario } from '@/hooks/useHistoricoConsolidado';

interface DetalheEventoProps {
  evento: EventoCalendario | null;
  isOpen: boolean;
  onClose: () => void;
}

const DetalheEvento: React.FC<DetalheEventoProps> = ({ evento, isOpen, onClose }) => {
  if (!evento) return null;

  const { resource } = evento;
  
  // Agrupar pedidos por fornecedor
  const pedidosPorFornecedor = resource.pedidos.reduce((acc, pedido) => {
    if (!acc[pedido.fornecedor]) {
      acc[pedido.fornecedor] = [];
    }
    acc[pedido.fornecedor].push(pedido);
    return acc;
  }, {} as Record<string, typeof resource.pedidos>);

  const fornecedores = [...new Set(resource.pedidos.map(p => p.fornecedor))];
  const tipos = [...new Set(resource.pedidos.map(p => p.tipo))];
  const compradores = [...new Set(resource.pedidos.map(p => p.comprador))];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pedidos de {new Date(evento.start).toLocaleDateString('pt-BR')}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo do Dia */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{resource.pedidos.length}</div>
              <div className="text-sm text-muted-foreground">Pedidos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">R$ {resource.totalValor.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{fornecedores.length}</div>
              <div className="text-sm text-muted-foreground">Fornecedores</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{resource.totalItens}</div>
              <div className="text-sm text-muted-foreground">Total de Itens</div>
            </CardContent>
          </Card>
        </div>

        {/* Tipos de Pedidos */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Tipos de Pedidos</h3>
          <div className="flex gap-2">
            {tipos.map(tipo => (
              <Badge key={tipo} variant={tipo === 'cotacao' ? 'default' : 'secondary'}>
                {tipo === 'cotacao' ? 'Cotação' : 'Simples'}
              </Badge>
            ))}
          </div>
        </div>

        {/* Fornecedores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Fornecedores ({fornecedores.length})</h3>
          <div className="flex flex-wrap gap-2">
            {fornecedores.map(fornecedor => (
              <Badge key={fornecedor} variant="outline">
                {fornecedor}
              </Badge>
            ))}
          </div>
        </div>

        {/* Lista Detalhada de Pedidos */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Detalhes dos Pedidos</h3>
          
          {Object.keys(pedidosPorFornecedor).length > 1 ? (
            Object.entries(pedidosPorFornecedor).map(([fornecedor, pedidos]) => (
              <Card key={fornecedor} className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{fornecedor}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pedidos.map((pedido) => (
                    <div key={pedido.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={pedido.tipo === 'cotacao' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {pedido.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                          </Badge>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {pedido.comprador} - {pedido.usuario_loja}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {pedido.totalItens} itens • {new Date(pedido.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {pedido.observacoes && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            {pedido.observacoes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          R$ {pedido.valorTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4">
                {resource.pedidos.map((pedido) => (
                  <div key={pedido.id} className="flex justify-between items-center p-3 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge 
                          variant={pedido.tipo === 'cotacao' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {pedido.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {pedido.comprador}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {pedido.totalItens} itens • {new Date(pedido.data).toLocaleTimeString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">R$ {pedido.valorTotal.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumo Final */}
        {resource.pedidos.length > 1 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                Média por Pedido: R$ {(resource.totalValor / resource.pedidos.length).toFixed(2)}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                {compradores.length} comprador{compradores.length > 1 ? 'es' : ''} • {fornecedores.length} fornecedor{fornecedores.length > 1 ? 'es' : ''}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DetalheEvento;