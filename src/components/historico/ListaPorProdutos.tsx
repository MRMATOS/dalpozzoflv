import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package2, TrendingUp, Users, Eye } from 'lucide-react';
import { PedidoConsolidado } from '@/hooks/useHistoricoConsolidado';
import { StaggerContainer, StaggerItem, HoverCard } from './AnimationUtils';
import ModalProdutoDetalhes from './ModalProdutoDetalhes';

interface ProdutoAgrupado {
  produto_nome: string;
  quantidade_total: number;
  fornecedores: {
    nome: string;
    quantidade: number;
    valor_unitario?: number;
    valor_total: number;
    data: string;
    tipo: string;
    pedido: PedidoConsolidado;
  }[];
  preco_medio?: number;
  unidade?: string;
  total_pedidos: number;
}

interface ListaPorProdutosProps {
  pedidos: PedidoConsolidado[];
  onPedidoClick: (pedido: PedidoConsolidado) => void;
  loading?: boolean;
}

const ListaPorProdutos: React.FC<ListaPorProdutosProps> = ({ 
  pedidos, 
  onPedidoClick, 
  loading 
}) => {
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoAgrupado | null>(null);

  // PARTE 4: Agrupar pedidos por produto
  const produtosAgrupados = useMemo(() => {
    const produtos = new Map<string, ProdutoAgrupado>();

    pedidos.forEach(pedido => {
      // Para cada pedido, precisamos buscar seus itens
      if (pedido.itens && pedido.itens.length > 0) {
        pedido.itens.forEach(item => {
          const key = item.produto_nome;
          const existing = produtos.get(key) || {
            produto_nome: item.produto_nome,
            quantidade_total: 0,
            fornecedores: [],
            unidade: item.unidade,
            total_pedidos: 0
          };

          // Adicionar fornecedor e seus dados
          const fornecedorExistente = existing.fornecedores.find(f => 
            f.nome === pedido.fornecedor && f.data.split('T')[0] === pedido.data.split('T')[0]
          );

          if (!fornecedorExistente) {
            existing.fornecedores.push({
              nome: pedido.fornecedor,
              quantidade: item.quantidade,
              valor_unitario: item.preco,
              valor_total: item.preco ? item.preco * item.quantidade : 0,
              data: pedido.data,
              tipo: pedido.tipo,
              pedido: pedido
            });
            existing.total_pedidos += 1;
          } else {
            fornecedorExistente.quantidade += item.quantidade;
            if (item.preco) {
              fornecedorExistente.valor_total += item.preco * item.quantidade;
            }
          }

          existing.quantidade_total += item.quantidade;
          
          // Calcular preço médio
          const precos = existing.fornecedores
            .filter(f => f.valor_unitario && f.valor_unitario > 0)
            .map(f => f.valor_unitario!);
          
          if (precos.length > 0) {
            existing.preco_medio = precos.reduce((a, b) => a + b, 0) / precos.length;
          }

          produtos.set(key, existing);
        });
      }
    });

    return Array.from(produtos.values())
      .sort((a, b) => b.quantidade_total - a.quantidade_total);
  }, [pedidos]);

  const handleProdutoClick = (produto: ProdutoAgrupado) => {
    setProdutoSelecionado(produto);
  };

  const handleFornecedorClick = (pedido: PedidoConsolidado) => {
    setProdutoSelecionado(null);
    onPedidoClick(pedido);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-muted rounded mb-2 w-1/2"></div>
              <div className="h-3 bg-muted rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (produtosAgrupados.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Package2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">
            Não há produtos nos pedidos filtrados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Package2 className="h-5 w-5" />
          <span className="font-medium">Produtos Agrupados</span>
          <Badge variant="secondary">{produtosAgrupados.length} produtos únicos</Badge>
        </div>

        <StaggerContainer className="space-y-3">
          {produtosAgrupados.map((produto, index) => (
            <StaggerItem key={produto.produto_nome}>
              <HoverCard 
                className="cursor-pointer transition-all duration-200 hover:shadow-md"
                onClick={() => handleProdutoClick(produto)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-sm truncate">
                          {produto.produto_nome}
                        </h4>
                        {produto.unidade && (
                          <Badge variant="outline" className="text-xs">
                            {produto.unidade}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Package2 className="h-3 w-3" />
                          <span>{produto.quantidade_total} {produto.unidade || 'un'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{produto.fornecedores.length} fornecedor{produto.fornecedores.length > 1 ? 'es' : ''}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{produto.total_pedidos} pedido{produto.total_pedidos > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {produto.fornecedores.slice(0, 3).map((fornecedor, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {fornecedor.nome}
                          </Badge>
                        ))}
                        {produto.fornecedores.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{produto.fornecedores.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end gap-1">
                      {produto.preco_medio && (
                        <div className="text-sm font-semibold text-green-600">
                          R$ {produto.preco_medio.toFixed(2)}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {produto.preco_medio ? 'preço médio' : ''}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProdutoClick(produto);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {produtoSelecionado && (
        <ModalProdutoDetalhes
          produto={produtoSelecionado}
          isOpen={!!produtoSelecionado}
          onClose={() => setProdutoSelecionado(null)}
          onFornecedorClick={handleFornecedorClick}
        />
      )}
    </>
  );
};

export default ListaPorProdutos;