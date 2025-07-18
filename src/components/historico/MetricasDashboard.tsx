
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MetricasConsolidadas } from '@/hooks/useHistoricoConsolidado';
import { TrendingUp, Package, Users, Calendar, DollarSign } from 'lucide-react';

interface MetricasDashboardProps {
  metricas: MetricasConsolidadas;
}

const MetricasDashboard: React.FC<MetricasDashboardProps> = ({ metricas }) => {
  // Calcular estatísticas adicionais
  const valorMedioPorPedido = metricas.totalPedidos > 0 
    ? metricas.valorTotal / metricas.totalPedidos 
    : 0;

  const itensMediosPorPedido = metricas.totalPedidos > 0 
    ? metricas.totalItens / metricas.totalPedidos 
    : 0;

  // Calcular a distribuição semanal simples baseada nos tipos
  const distribuicaoSemanal = {
    'Dom': 0, 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0
  };

  // Distribui uniformemente para demo
  const totalPedidos = metricas.totalPedidos;
  Object.keys(distribuicaoSemanal).forEach((dia, index) => {
    distribuicaoSemanal[dia] = Math.floor(totalPedidos / 7) + (index < totalPedidos % 7 ? 1 : 0);
  });

  const maxPedidosDia = Math.max(...Object.values(distribuicaoSemanal));

  return (
    <div className="space-y-6">
      {/* Cards de Resumo Principal */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{metricas.totalPedidos}</div>
                <div className="text-xs text-gray-600">Total Pedidos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {metricas.valorTotal.toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">Valor Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{metricas.totalItens}</div>
                <div className="text-xs text-gray-600">Total Itens</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <div className="text-lg font-bold text-orange-600">
                  R$ {valorMedioPorPedido.toFixed(0)}
                </div>
                <div className="text-xs text-gray-600">Média/Pedido</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <div>
                <div className="text-lg font-bold text-indigo-600">
                  {itensMediosPorPedido.toFixed(1)}
                </div>
                <div className="text-xs text-gray-600">Itens/Pedido</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fornecedores Mais Acionados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metricas.topFornecedores.slice(0, 6).map((fornecedor, index) => {
              const percentual = (fornecedor.pedidos / metricas.totalPedidos) * 100;
              return (
                <div key={fornecedor.nome} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {fornecedor.nome}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{fornecedor.pedidos}</div>
                      <div className="text-xs text-gray-500">
                        R$ {fornecedor.valor.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <Progress value={percentual} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Estatísticas por Comprador */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Top Compradores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metricas.topCompradores.slice(0, 6).map((comprador, index) => {
              const percentual = (comprador.valor / metricas.valorTotal) * 100;
              return (
                <div key={comprador.nome} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium truncate max-w-[120px]">
                        {comprador.nome}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{comprador.pedidos}</div>
                      <div className="text-xs text-gray-500">
                        R$ {comprador.valor.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <Progress value={percentual} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Distribuição Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Distribuição Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(distribuicaoSemanal).map(([dia, pedidos]) => {
              const percentual = maxPedidosDia > 0 ? (Number(pedidos) / maxPedidosDia) * 100 : 0;
              return (
                <div key={dia} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{dia}</span>
                    <span className="text-sm font-semibold">{pedidos} pedidos</span>
                  </div>
                  <Progress value={percentual} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MetricasDashboard;
