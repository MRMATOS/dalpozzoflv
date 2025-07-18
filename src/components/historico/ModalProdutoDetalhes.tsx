import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package2, Calendar, DollarSign, TrendingUp, Eye } from 'lucide-react';
import { PedidoConsolidado } from '@/hooks/useHistoricoConsolidado';

interface ProdutoDetalhado {
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

interface ModalProdutoDetalhesProps {
  produto: ProdutoDetalhado;
  isOpen: boolean;
  onClose: () => void;
  onFornecedorClick: (pedido: PedidoConsolidado) => void;
}

const ModalProdutoDetalhes: React.FC<ModalProdutoDetalhesProps> = ({
  produto,
  isOpen,
  onClose,
  onFornecedorClick
}) => {
  const valorTotalProduto = produto.fornecedores.reduce((sum, f) => sum + f.valor_total, 0);
  const fornecedoresOrdenados = produto.fornecedores.sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Detalhes do Produto: {produto.produto_nome}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo do Produto */}
        <Card className="border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {produto.quantidade_total}
                </div>
                <div className="text-sm text-muted-foreground">
                  {produto.unidade || 'unidades'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {produto.fornecedores.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Fornecedores
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {produto.total_pedidos}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pedidos
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  R$ {valorTotalProduto.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Valor Total
                </div>
              </div>
            </div>
            
            {produto.preco_medio && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-600">
                  R$ {produto.preco_medio.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Preço médio por {produto.unidade || 'unidade'}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fornecedores que Venderam Este Produto
              <Badge variant="secondary">{produto.fornecedores.length} fornecedores</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fornecedoresOrdenados.map((fornecedor, index) => (
                <Card 
                  key={`${fornecedor.nome}-${fornecedor.data}-${index}`}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onFornecedorClick(fornecedor.pedido)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{fornecedor.nome}</h4>
                          <Badge 
                            variant={fornecedor.tipo === 'cotacao' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {fornecedor.tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFornecedorClick(fornecedor.pedido);
                            }}
                            title="Ver pedido completo"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Package2 className="h-3 w-3 text-muted-foreground" />
                            <span>{fornecedor.quantidade} {produto.unidade || 'un'}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(fornecedor.data).toLocaleDateString('pt-BR')}</span>
                          </div>
                          
                          {fornecedor.valor_unitario && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <span>R$ {fornecedor.valor_unitario.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          R$ {fornecedor.valor_total.toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total do item
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Preços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Variação de Preços</h4>
                <div className="space-y-1 text-sm">
                  {(() => {
                    const precos = produto.fornecedores
                      .filter(f => f.valor_unitario && f.valor_unitario > 0)
                      .map(f => f.valor_unitario!);
                    
                    if (precos.length === 0) return <span className="text-muted-foreground">Sem dados de preço</span>;
                    
                    const menor = Math.min(...precos);
                    const maior = Math.max(...precos);
                    const diferenca = ((maior - menor) / menor * 100);
                    
                    return (
                      <>
                        <div>Menor preço: <span className="font-medium text-green-600">R$ {menor.toFixed(2)}</span></div>
                        <div>Maior preço: <span className="font-medium text-red-600">R$ {maior.toFixed(2)}</span></div>
                        <div>Variação: <span className="font-medium">{diferenca.toFixed(1)}%</span></div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tipos de Pedido</h4>
                <div className="flex gap-2">
                  {['cotacao', 'simples'].map(tipo => {
                    const count = produto.fornecedores.filter(f => f.tipo === tipo).length;
                    return count > 0 ? (
                      <Badge key={tipo} variant={tipo === 'cotacao' ? 'default' : 'secondary'}>
                        {count} {tipo === 'cotacao' ? 'Cotação' : 'Simples'}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ModalProdutoDetalhes;