import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Package, Clock, DollarSign, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface PedidoCompra {
  id: string;
  criado_em: string;
  total: number;
  status: string;
  fornecedores: {
    nome: string;
  };
  itens_pedido: {
    produto_id: string;
    preco: number;
    quantidade: number;
    tipo: string;
    unidade: string;
    produtos: {
      produto: string;
      nome_base: string;
      nome_variacao: string;
    };
  }[];
}

const HistoricoPedidos: React.FC = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPedido, setExpandedPedido] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({
    fornecedor: 'todos',
    status: 'todos',
    dataInicio: '',
    dataFim: '',
    busca: ''
  });

  const carregarPedidos = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('pedidos_compra')
        .select(`
          id,
          criado_em,
          total,
          status,
          fornecedores (nome),
          itens_pedido (
            produto_id,
            preco,
            quantidade,
            tipo,
            unidade,
            produtos (produto, nome_base, nome_variacao)
          )
        `)
        .eq('user_id', user?.id)
        .order('criado_em', { ascending: false });

      // Aplicar filtros
      if (filtros.status && filtros.status !== 'todos') {
        query = query.eq('status', filtros.status);
      }
      
      if (filtros.dataInicio) {
        query = query.gte('criado_em', filtros.dataInicio);
      }
      
      if (filtros.dataFim) {
        query = query.lte('criado_em', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar pedidos:', error);
        toast.error('Erro ao carregar histórico de pedidos');
        return;
      }

      let pedidosFiltrados = data || [];

      // Filtrar por fornecedor (pós-query)
      if (filtros.fornecedor && filtros.fornecedor !== 'todos') {
        pedidosFiltrados = pedidosFiltrados.filter(pedido => 
          pedido.fornecedores?.nome?.toLowerCase().includes(filtros.fornecedor.toLowerCase())
        );
      }

      // Filtrar por busca
      if (filtros.busca) {
        pedidosFiltrados = pedidosFiltrados.filter(pedido => {
          const buscaLower = filtros.busca.toLowerCase();
          return (
            pedido.fornecedores?.nome?.toLowerCase().includes(buscaLower) ||
            pedido.itens_pedido.some(item => 
              item.produtos?.produto?.toLowerCase().includes(buscaLower) ||
              item.produtos?.nome_base?.toLowerCase().includes(buscaLower) ||
              item.produtos?.nome_variacao?.toLowerCase().includes(buscaLower) ||
              item.tipo?.toLowerCase().includes(buscaLower)
            )
          );
        });
      }

      setPedidos(pedidosFiltrados);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar histórico de pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      carregarPedidos();
    }
  }, [user?.id, filtros]);

  const togglePedidoExpansion = (pedidoId: string) => {
    setExpandedPedido(prev => prev === pedidoId ? null : pedidoId);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'enviado':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'aberto':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'cancelado':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const limparFiltros = () => {
    setFiltros({
      fornecedor: 'todos',
      status: 'todos',
      dataInicio: '',
      dataFim: '',
      busca: ''
    });
  };

  const statusUnicos = [...new Set(pedidos.map(p => p.status).filter(Boolean))];
  const fornecedoresUnicos = [...new Set(pedidos.map(p => p.fornecedores?.nome).filter(Boolean))];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Fornecedor, produto..."
                  value={filtros.busca}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fornecedor</label>
              <Select value={filtros.fornecedor} onValueChange={(value) => setFiltros(prev => ({ ...prev, fornecedor: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os fornecedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os fornecedores</SelectItem>
                  {fornecedoresUnicos.map(fornecedor => (
                    <SelectItem key={fornecedor} value={fornecedor || ''}>
                      {fornecedor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filtros.status} onValueChange={(value) => setFiltros(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {statusUnicos.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={limparFiltros} className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      {pedidos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum pedido encontrado</p>
            <p className="text-sm text-gray-400 mt-2">
              {Object.values(filtros).some(Boolean) 
                ? "Tente ajustar os filtros para ver mais resultados"
                : "Crie seu primeiro pedido na aba Nova Cotação"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pedidos.map((pedido) => (
            <Card key={pedido.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">
                        {pedido.fornecedores?.nome || 'Fornecedor não informado'}
                      </h3>
                      <Badge className={getStatusColor(pedido.status)}>
                        {pedido.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatarData(pedido.criado_em)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {formatarMoeda(pedido.total)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {pedido.itens_pedido?.length || 0} itens
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePedidoExpansion(pedido.id)}
                    className="flex items-center gap-1"
                  >
                    {expandedPedido === pedido.id ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver detalhes
                      </>
                    )}
                  </Button>
                </div>

                {expandedPedido === pedido.id && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Itens do Pedido:</h4>
                      <div className="space-y-2">
                        {pedido.itens_pedido?.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium">
                                {item.produtos?.produto || item.produtos?.nome_base || 'Produto não identificado'}
                              </p>
                              {item.produtos?.nome_variacao && (
                                <p className="text-sm text-gray-600">{item.produtos.nome_variacao}</p>
                              )}
                              {item.tipo && (
                                <p className="text-sm text-gray-600">Tipo: {item.tipo}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {item.quantidade} {item.unidade}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatarMoeda(item.preco)} / {item.unidade}
                              </p>
                              <p className="text-sm font-medium text-green-600">
                                Total: {formatarMoeda(item.preco * item.quantidade)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoricoPedidos;