
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFornecedores } from '@/hooks/useFornecedores';

interface PedidoHistorico {
  id: string;
  criado_em: string;
  total: number;
  fornecedor_id: string;
  fornecedor_nome?: string;
  quantidade_itens: number;
  cotacao_id?: string;
}

interface ItemPedido {
  produto_nome: string;
  tipo: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  unidade: string;
}

const HistoricoPedidos = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { fornecedores } = useFornecedores();
  const [pedidos, setPedidos] = useState<PedidoHistorico[]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoHistorico | null>(null);
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const buscarPedidos = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('pedidos_compra')
          .select(`
            id,
            criado_em,
            total,
            fornecedor_id,
            cotacao_id,
            itens_pedido(id)
          `)
          .eq('user_id', user.id)
          .order('criado_em', { ascending: false });

        if (error) {
          console.error('Erro ao buscar pedidos:', error);
          return;
        }

        const pedidosComDetalhes = data.map(pedido => {
          const fornecedor = fornecedores.find(f => f.id === pedido.fornecedor_id);
          return {
            ...pedido,
            fornecedor_nome: fornecedor?.nome || 'Fornecedor não encontrado',
            quantidade_itens: pedido.itens_pedido?.length || 0
          };
        });

        setPedidos(pedidosComDetalhes);
      } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    buscarPedidos();
  }, [user?.id, fornecedores]);

  const buscarItensPedido = async (pedidoId: string) => {
    try {
      const { data, error } = await supabase
        .from('itens_pedido')
        .select('*')
        .eq('pedido_id', pedidoId);

      if (error) {
        console.error('Erro ao buscar itens do pedido:', error);
        return;
      }

      const itens = data.map(item => ({
        produto_nome: item.produto_nome || 'Produto não identificado',
        tipo: item.tipo || 'Tipo não identificado',
        quantidade: item.quantidade || 0,
        preco: item.preco || 0,
        subtotal: (item.quantidade || 0) * (item.preco || 0),
        unidade: item.unidade || 'Caixa'
      }));

      setItensPedido(itens);
    } catch (error) {
      console.error('Erro ao buscar itens do pedido:', error);
    }
  };

  const selecionarPedido = (pedido: PedidoHistorico) => {
    setPedidoSelecionado(pedido);
    buscarItensPedido(pedido.id);
  };

  const voltarParaLista = () => {
    setPedidoSelecionado(null);
    setItensPedido([]);
  };

  const pluralizarUnidade = (unidade: string, quantidade: number): string => {
    if (quantidade === 1) return unidade;

    const pluralizacao: { [key: string]: string } = {
      'Caixa': 'Caixas',
      'Dúzia': 'Dúzias',
      'Unidade': 'Unidades',
      'Bandeja': 'Bandejas',
      'Maço': 'Maços',
      'Kg': 'Kg'
    };

    return pluralizacao[unidade] || unidade;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Carregando histórico...</div>
      </div>
    );
  }

  // Visualização de detalhes do pedido
  if (pedidoSelecionado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" onClick={voltarParaLista}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Pedido - {pedidoSelecionado.fornecedor_nome}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {new Date(pedidoSelecionado.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="text-blue-600" />
                {pedidoSelecionado.fornecedor_nome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itensPedido.map((item, index) => {
                  const unidadePlural = pluralizarUnidade(item.unidade, item.quantidade);
                  
                  return (
                    <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{item.produto_nome}</h3>
                          <Badge variant="secondary">{item.tipo}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Quantidade:</span> {item.quantidade} {unidadePlural}
                          </div>
                          <div>
                            <span className="font-medium">Preço unitário:</span> R$ {item.preco.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Subtotal:</span> R$ {item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total geral:</span>
                    <span className="text-xl font-bold text-blue-600">
                      R$ {pedidoSelecionado.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // Lista de pedidos
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Histórico de Pedidos</h1>
                <p className="text-sm text-gray-500">Sistema FLV</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <p className="text-xs text-gray-500">Comprador</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pedidos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum pedido encontrado</h2>
              <p className="text-gray-600 mb-4">
                Você ainda não fez nenhum pedido. Vá para a cotação para criar seu primeiro pedido.
              </p>
              <Button onClick={() => navigate('/cotacao')}>
                Fazer Nova Cotação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pedidos.map((pedido) => (
              <Card key={pedido.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => selecionarPedido(pedido)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{pedido.fornecedor_nome}</h3>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {pedido.quantidade_itens} itens
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(pedido.criado_em).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          R$ {pedido.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoricoPedidos;
