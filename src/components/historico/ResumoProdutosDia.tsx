
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package2, Users, TrendingUp, Eye, Calendar, Clock } from 'lucide-react';
import { formatarDataBrasil, StatusBadge, calcularStatusVisual } from './PedidoUtils';

interface ProdutoDia {
  produto_nome: string;
  quantidade_total: number;
  pedidos_count: number;
  fornecedores: string[];
  preco_medio?: number;
  unidade?: string;
  tipos?: string[];
  // NOVO: Informações de data para pedidos simples
  datas_previstas?: string[];
  datas_pedido?: string[];
  status_entregas?: string[];
}

interface ResumoProdutosDiaProps {
  produtos: ProdutoDia[];
  data: string;
  loading?: boolean;
  onVerPedido?: (fornecedor: string) => void;
}

type FiltroTipo = 'todos' | 'simples' | 'cotacao';

const ResumoProdutosDia: React.FC<ResumoProdutosDiaProps> = ({ produtos, data, loading, onVerPedido }) => {
  const dataFormatada = new Date(data).toLocaleDateString('pt-BR');
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTipo>('todos');

  const produtosFiltrados = useMemo(() => {
    if (filtroAtivo === 'todos') return produtos;
    
    return produtos.filter(produto => {
      if (!produto.tipos || produto.tipos.length === 0) return filtroAtivo === 'simples';
      return produto.tipos.includes(filtroAtivo);
    });
  }, [produtos, filtroAtivo]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Produtos Pedidos em {dataFormatada}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando produtos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (produtos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Produtos Pedidos em {dataFormatada}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum produto encontrado para este dia</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Produtos Pedidos em {dataFormatada}
            <Badge variant="secondary">{produtosFiltrados.length} produtos</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtrar:</span>
            <div className="flex gap-1">
              <Button
                variant={filtroAtivo === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('todos')}
                className="h-7 px-3"
              >
                Todos
              </Button>
              <Button
                variant={filtroAtivo === 'simples' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('simples')}
                className="h-7 px-3"
              >
                Pedido Simples
              </Button>
              <Button
                variant={filtroAtivo === 'cotacao' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroAtivo('cotacao')}
                className="h-7 px-3"
              >
                Cotação
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {produtosFiltrados.map((produto, index) => {
            // NOVO: Determinar se é pedido simples para mostrar informações específicas
            const temPedidoSimples = produto.tipos?.includes('simples');
            const statusPredominante = produto.status_entregas?.[0];
            
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{produto.produto_nome}</h4>
                    {produto.unidade && (
                      <Badge variant="outline" className="text-xs">
                        {produto.unidade}
                      </Badge>
                    )}
                    {/* NOVO: Status badge para pedidos simples */}
                    {temPedidoSimples && statusPredominante && (
                      <StatusBadge status={statusPredominante} className="text-xs" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package2 className="h-3 w-3" />
                      <span>{produto.quantidade_total} {produto.unidade || 'un'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{produto.pedidos_count} pedido{produto.pedidos_count > 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{produto.fornecedores.length} fornecedor{produto.fornecedores.length > 1 ? 'es' : ''}</span>
                    </div>
                  </div>
                  
                  {/* NOVO: Informações de data para pedidos simples */}
                  {temPedidoSimples && produto.datas_previstas && produto.datas_previstas.length > 0 && (
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Previsto: {formatarDataBrasil(produto.datas_previstas[0])}</span>
                      </div>
                      {produto.datas_pedido && produto.datas_pedido[0] && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Pedido: {formatarDataBrasil(produto.datas_pedido[0])}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {produto.fornecedores.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {produto.fornecedores.slice(0, 2).map((fornecedor, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-xs">
                            {fornecedor}
                          </Badge>
                          {onVerPedido && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onVerPedido(fornecedor);
                              }}
                              className="h-5 w-5 p-0 hover:bg-primary/20"
                              title="Ver pedido deste fornecedor"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {produto.fornecedores.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{produto.fornecedores.length - 2} mais
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  {produto.preco_medio && (
                    <div className="text-sm font-semibold text-green-600">
                      R$ {produto.preco_medio.toFixed(2)}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {produto.preco_medio ? 'preço médio' : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumoProdutosDia;
