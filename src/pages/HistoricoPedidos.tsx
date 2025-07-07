
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Package, Calendar, DollarSign, Users, Eye } from 'lucide-react';
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
  usuario_nome?: string;
  usuario_loja?: string;
  usuario_tipo?: string;
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
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { fornecedores } = useFornecedores();
  const [pedidos, setPedidos] = useState<PedidoHistorico[]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<PedidoHistorico | null>(null);
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visualizarTodos, setVisualizarTodos] = useState<boolean>(false);

  const isMaster = profile?.tipo === 'master';

  useEffect(() => {
    const buscarPedidos = async () => {
      // Se ainda está carregando autenticação, aguardar
      if (authLoading) {
        console.log('Aguardando autenticação...');
        return;
      }

      // Se não há usuário autenticado após loading, não buscar
      if (!user?.id && !authLoading) {
        console.log('Usuário não autenticado, não buscando pedidos');
        setIsLoading(false);
        return;
      }

      try {
        console.log('=== INICIANDO BUSCA DE PEDIDOS ===');
        console.log('User ID:', user?.id);
        console.log('É Master:', isMaster);
        console.log('Visualizar Todos:', visualizarTodos);

        // 1. BUSCAR PEDIDOS (consulta simplificada)
        let query = supabase
          .from('pedidos_compra')
          .select(`
            id,
            criado_em,
            total,
            fornecedor_id,
            cotacao_id,
            user_id
          `);

        // Aplicar filtro de usuário se necessário
        if (!isMaster || !visualizarTodos) {
          if (user?.id) {
            query = query.eq('user_id', user.id);
            console.log('Aplicando filtro por user_id:', user.id);
          }
        } else {
          console.log('Master visualizando todos os pedidos');
        }

        const { data: pedidosData, error: pedidosError } = await query.order('criado_em', { ascending: false });

        if (pedidosError) {
          console.error('ERRO ao buscar pedidos:', pedidosError);
          setIsLoading(false);
          return;
        }

        console.log('PEDIDOS encontrados:', pedidosData?.length || 0, pedidosData);

        if (!pedidosData || pedidosData.length === 0) {
          console.log('Nenhum pedido encontrado');
          setPedidos([]);
          setIsLoading(false);
          return;
        }

        // 2. BUSCAR DADOS DOS USUÁRIOS (se necessário)
        const userIds = [...new Set(pedidosData.map(p => p.user_id).filter(id => id))];
        let usuariosMap = new Map();

        if (userIds.length > 0) {
          const { data: usuariosData, error: usuariosError } = await supabase
            .from('usuarios')
            .select('id, nome, loja, tipo')
            .in('id', userIds);

          if (usuariosError) {
            console.error('Erro ao buscar usuários:', usuariosError);
          } else {
            usuariosData?.forEach(usuario => {
              usuariosMap.set(usuario.id, usuario);
            });
            console.log('USUÁRIOS carregados:', usuariosData?.length || 0);
          }
        }

        // 3. BUSCAR CONTAGEM DE ITENS PARA CADA PEDIDO
        const pedidosComDetalhes = await Promise.all(
          pedidosData.map(async (pedido) => {
            try {
              const { data: itensData } = await supabase
                .from('itens_pedido')
                .select('id')
                .eq('pedido_id', pedido.id);

              const fornecedor = fornecedores.find(f => f.id === pedido.fornecedor_id);
              const usuario = usuariosMap.get(pedido.user_id);
              
              return {
                ...pedido,
                fornecedor_nome: fornecedor?.nome || 'Fornecedor não encontrado',
                quantidade_itens: itensData?.length || 0,
                usuario_nome: usuario?.nome || 'Usuário não identificado',
                usuario_loja: usuario?.loja || '',
                usuario_tipo: usuario?.tipo || ''
              };
            } catch (error) {
              console.error('Erro ao processar pedido:', pedido.id, error);
              return {
                ...pedido,
                fornecedor_nome: 'Erro ao carregar',
                quantidade_itens: 0,
                usuario_nome: 'Erro ao carregar',
                usuario_loja: '',
                usuario_tipo: ''
              };
            }
          })
        );

        console.log('=== PEDIDOS FINAIS ===', pedidosComDetalhes.length, pedidosComDetalhes);
        setPedidos(pedidosComDetalhes);
      } catch (error) {
        console.error('ERRO GERAL ao buscar pedidos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    buscarPedidos();
  }, [user?.id, fornecedores, isMaster, visualizarTodos, authLoading]);

  const buscarItensPedido = async (pedidoId: string) => {
    try {
      const { data, error } = await supabase
        .from('itens_pedido')
        .select(`
          *,
          produtos(nome_base, nome_variacao)
        `)
        .eq('pedido_id', pedidoId);

      if (error) {
        console.error('Erro ao buscar itens do pedido:', error);
        return;
      }

      const itens = data.map(item => {
        // Construir o nome do produto a partir dos dados relacionados ou usar campos existentes
        let produtoNome = 'Produto não identificado';
        
        if (item.produtos) {
          const produto = item.produtos as any;
          produtoNome = produto.nome_base || produto.nome_variacao || 'Produto não identificado';
        }

        return {
          produto_nome: produtoNome,
          tipo: item.tipo || 'Tipo não identificado',
          quantidade: item.quantidade || 0,
          preco: item.preco || 0,
          subtotal: (item.quantidade || 0) * (item.preco || 0),
          unidade: item.unidade || 'Caixa'
        };
      });

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
                   <div className="flex items-center gap-2 text-sm text-gray-500">
                     <span>{new Date(pedidoSelecionado.criado_em).toLocaleDateString('pt-BR')}</span>
                     {visualizarTodos && pedidoSelecionado.usuario_nome && (
                       <>
                         <span>•</span>
                         <span>Por: {pedidoSelecionado.usuario_nome}</span>
                         {pedidoSelecionado.usuario_loja && (
                           <>
                             <span>•</span>
                             <span>Loja: {pedidoSelecionado.usuario_loja}</span>
                           </>
                         )}
                       </>
                     )}
                   </div>
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
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros para Masters */}
        {isMaster && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Opções de Visualização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Visualizar pedidos de todos os usuários</span>
                <Switch
                  checked={visualizarTodos}
                  onCheckedChange={setVisualizarTodos}
                />
                {visualizarTodos && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    Modo Admin
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                       <div className="flex items-center gap-3 mb-2 flex-wrap">
                         <h3 className="font-semibold text-gray-900">{pedido.fornecedor_nome}</h3>
                         <Badge variant="outline" className="flex items-center gap-1">
                           <Package className="h-3 w-3" />
                           {pedido.quantidade_itens} itens
                         </Badge>
                         {visualizarTodos && pedido.usuario_nome && (
                           <div className="flex items-center gap-2">
                             <Badge variant="outline" className="text-xs">
                               <Users className="h-3 w-3 mr-1" />
                               {pedido.usuario_nome}
                             </Badge>
                             {pedido.usuario_loja && (
                               <Badge variant="secondary" className="text-xs">
                                 {pedido.usuario_loja}
                               </Badge>
                             )}
                             {pedido.usuario_tipo && (
                               <Badge variant="secondary" className="text-xs">
                                 {pedido.usuario_tipo}
                               </Badge>
                             )}
                           </div>
                         )}
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
