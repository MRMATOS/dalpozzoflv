import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Package, 
  Search,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  FileText
} from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';

const PedidosParaRecebimento = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Log para debugging
  console.log('PedidosParaRecebimento renderizado');
  const [filtroFornecedor, setFiltroFornecedor] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [expandedPedidos, setExpandedPedidos] = useState<Set<string>>(new Set());

  // Buscar pedidos de compra
  const { data: pedidosCompra } = useQuery({
    queryKey: ['pedidos-compra-recebimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_compra')
        .select(`
          *,
          fornecedores(nome),
          itens_pedido(
            id,
            produto_id,
            quantidade,
            preco,
            produtos(produto)
          )
        `)
        .eq('status', 'aberto')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar pedidos simples
  const { data: pedidosSimples } = useQuery({
    queryKey: ['pedidos-simples-recebimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos_simples')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const toggleExpanded = (pedidoId: string) => {
    const newExpanded = new Set(expandedPedidos);
    if (newExpanded.has(pedidoId)) {
      newExpanded.delete(pedidoId);
    } else {
      newExpanded.add(pedidoId);
    }
    setExpandedPedidos(newExpanded);
  };

  const selecionarPedido = (pedido: any, tipo: 'compra' | 'simples') => {
    const url = `/recebimento/novo?pedido_id=${pedido.id}&tipo=${tipo}`;
    navigate(url);
  };

  // Combinar e filtrar pedidos
  const pedidosCompraComTipo = pedidosCompra?.map(p => ({ 
    ...p, 
    tipo: 'compra' as const, 
    fornecedor: p.fornecedores?.nome,
    valor_total: p.total || 0,
    num_itens: p.itens_pedido?.length || 0
  })) || [];

  const pedidosSimplesComTipo = pedidosSimples?.map(p => ({ 
    ...p, 
    tipo: 'simples' as const, 
    fornecedor: p.fornecedor_nome,
    valor_total: p.valor_total_estimado,
    num_itens: 1
  })) || [];

  const todosPedidos = [...pedidosCompraComTipo, ...pedidosSimplesComTipo].filter(pedido => {
    if (filtroFornecedor && filtroFornecedor !== 'todos' && pedido.fornecedor !== filtroFornecedor) return false;
    if (busca && !pedido.fornecedor?.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const fornecedoresUnicos = [...new Set(todosPedidos.map(p => p.fornecedor).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/recebimento')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Selecionar Pedido</h1>
                <p className="text-sm text-gray-500">Escolha um pedido para iniciar o recebimento</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Etapa 1/3 - Seleção de Pedido
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar Fornecedor</label>
                <Input
                  placeholder="Digite o nome do fornecedor..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Fornecedor</label>
                <Select value={filtroFornecedor} onValueChange={setFiltroFornecedor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os fornecedores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os fornecedores</SelectItem>
                    {fornecedoresUnicos.map(fornecedor => (
                      <SelectItem key={fornecedor} value={fornecedor}>
                        {fornecedor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBusca('');
                    setFiltroFornecedor('todos');
                    setFiltroStatus('');
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pedidos */}
        <div className="space-y-4">
          {todosPedidos.length > 0 ? (
            todosPedidos.map((pedido) => (
              <Card key={`${pedido.tipo}-${pedido.id}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {pedido.tipo === 'compra' ? (
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-600" />
                          )}
                          <Badge variant={pedido.tipo === 'compra' ? 'default' : 'secondary'}>
                            {pedido.tipo === 'compra' ? 'Pedido de Compra' : 'Pedido Simples'}
                          </Badge>
                        </div>
                        <span className="font-medium text-gray-900">{pedido.fornecedor}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                        <div>
                          Data: {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                        <div>
                          Valor: R$ {pedido.valor_total.toFixed(2)}
                        </div>
                        <div>
                          {pedido.tipo === 'compra' ? 
                            `${pedido.num_itens} itens` :
                            `1 produto: ${pedido.produto_nome}`
                          }
                        </div>
                      </div>

                      {expandedPedidos.has(`${pedido.tipo}-${pedido.id}`) && pedido.tipo === 'compra' && 'itens_pedido' in pedido && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-sm mb-2">Produtos no Pedido:</h4>
                          <div className="space-y-1">
                            {pedido.itens_pedido?.map((item: any) => (
                              <div key={item.id} className="flex justify-between text-xs">
                                <span>{item.produtos?.produto || 'Produto não encontrado'}</span>
                                <span>{item.quantidade} x R$ {item.preco?.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {pedido.tipo === 'compra' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(`${pedido.tipo}-${pedido.id}`)}
                        >
                          {expandedPedidos.has(`${pedido.tipo}-${pedido.id}`) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => selecionarPedido(pedido, pedido.tipo)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Selecionar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
                <p className="text-gray-500">
                  Não há pedidos em aberto para recebimento no momento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default PedidosParaRecebimento;