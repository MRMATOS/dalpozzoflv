import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Save, AlertCircle, Plus, Minus, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useEstoque } from '@/hooks/useEstoque';

interface Produto {
  id: string;
  produto: string | null;
  nome_variacao: string | null;
  produto_pai_id: string | null;
  unidade: string | null;
  ativo: boolean | null;
  quantidade_atual?: number;
  display_name?: string;
  produto_pai?: { produto: string } | null;
}

const Estoque = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { error: estoqueError, recarregarEstoque } = useEstoque();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  // Carregar produtos e estoque atual com estrutura de variações
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('Carregando produtos para a loja:', profile?.loja);

        // Buscar produtos ativos com informações de produto pai
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select(`
            id, 
            produto, 
            nome_variacao,
            produto_pai_id,
            unidade, 
            ativo,
            produto_pai:produtos(produto)
          `)
          .eq('ativo', true)
          .order('produto, nome_variacao');

        if (produtosError) {
          console.error('Erro ao carregar produtos:', produtosError);
          setError(`Erro ao carregar produtos: ${produtosError.message}`);
          return;
        }

        console.log('Produtos carregados:', produtosData);

        // Buscar estoque atual da loja
        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_atual')
          .select('produto_id, quantidade')
          .eq('loja', profile?.loja);

        if (estoqueError) {
          console.error('Erro ao carregar estoque:', estoqueError);
          setError(`Erro ao carregar estoque atual: ${estoqueError.message}`);
          return;
        }

        // Mapear estoque por produto_id
        const estoqueMap = new Map();
        estoqueData?.forEach(item => {
          estoqueMap.set(item.produto_id, item.quantidade);
        });

        // Processar produtos com nomenclatura correta
        const produtosComEstoque = produtosData?.map(produto => {
          const produtoPai = (produto as any).produto_pai;
          let displayName = '';
          
          if (produto.nome_variacao && produtoPai?.produto) {
            // É uma variação - formato: "Produto Pai + Variação"
            displayName = `${produtoPai.produto} ${produto.nome_variacao}`;
          } else if (produto.produto) {
            // É um produto principal
            displayName = produto.produto;
          } else {
            // Fallback
            displayName = 'Produto sem nome';
          }

          return {
            ...produto,
            quantidade_atual: estoqueMap.get(produto.id) || 0,
            display_name: displayName,
            produto_pai: produtoPai
          };
        }) || [];

        setProdutos(produtosComEstoque);
        console.log('Produtos com estoque carregados:', produtosComEstoque);
      } catch (error) {
        console.error('Erro geral ao carregar dados:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        setError(`Erro interno: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.loja) {
      carregarProdutos();
    }
  }, [profile]);

  // Listener para mudanças em produtos e estoque em tempo real
  useEffect(() => {
    const produtosChannel = supabase
      .channel('produtos-estoque-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos'
        },
        (payload) => {
          console.log('Produto alterado, recarregando lista:', payload);
          // Recarregar quando houver mudanças em produtos
          window.location.reload();
        }
      )
      .subscribe();

    const estoqueChannel = supabase
      .channel('estoque-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estoque_atual',
          filter: `loja=eq.${profile?.loja}`
        },
        (payload) => {
          console.log('Estoque alterado:', payload);
          // Atualizar apenas se for para esta loja
          if (payload.new && (payload.new as any).loja === profile?.loja) {
            const produtoId = (payload.new as any).produto_id;
            const novaQuantidade = (payload.new as any).quantidade;
            
            setProdutos(prev => prev.map(produto => 
              produto.id === produtoId 
                ? { ...produto, quantidade_atual: novaQuantidade }
                : produto
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(produtosChannel);
      supabase.removeChannel(estoqueChannel);
    };
  }, [profile]);

  // Busca melhorada para considerar produto pai + variação
  const produtosFiltrados = produtos.filter(p => {
    const termoBusca = buscaProduto.toLowerCase();
    const displayName = p.display_name?.toLowerCase() || '';
    const produto = p.produto?.toLowerCase() || '';
    const variacao = p.nome_variacao?.toLowerCase() || '';
    const produtoPai = p.produto_pai?.produto?.toLowerCase() || '';
    
    return displayName.includes(termoBusca) ||
           produto.includes(termoBusca) ||
           variacao.includes(termoBusca) ||
           produtoPai.includes(termoBusca);
  });

  // Atualizar quantidade de um produto
  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    setProdutos(prev => prev.map(produto => 
      produto.id === produtoId ? {
        ...produto,
        quantidade_atual: Math.max(0, quantidade)
      } : produto
    ));
  };

  // Incrementar quantidade
  const incrementarQuantidade = (produtoId: string) => {
    setProdutos(prev => prev.map(produto => 
      produto.id === produtoId ? {
        ...produto,
        quantidade_atual: (produto.quantidade_atual || 0) + 1
      } : produto
    ));
  };

  // Decrementar quantidade
  const decrementarQuantidade = (produtoId: string) => {
    setProdutos(prev => prev.map(produto => 
      produto.id === produtoId ? {
        ...produto,
        quantidade_atual: Math.max(0, (produto.quantidade_atual || 0) - 1)
      } : produto
    ));
  };

  // Salvar estoque
  const salvarEstoque = async () => {
    if (!profile?.loja) {
      toast({
        title: "Erro de Perfil",
        description: "Informação da loja não encontrada no seu perfil. Não é possível salvar.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      console.log(`Iniciando salvamento de estoque para a loja: ${profile.loja}`);

      const dadosEstoque = produtos.map(produto => ({
        produto_id: produto.id,
        loja: profile.loja,
        quantidade: produto.quantidade_atual || 0,
        atualizado_em: new Date().toISOString()
      }));

      console.log(`Preparando para salvar ${dadosEstoque.length} registros de estoque.`);

      const { error } = await supabase
        .from('estoque_atual')
        .upsert(dadosEstoque, {
          onConflict: 'produto_id,loja'
        });

      if (error) {
        console.error('Erro detalhado do Supabase ao salvar estoque:', error);
        toast({
          title: "Erro ao salvar",
          description: `Não foi possível salvar o estoque: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Estoque salvo!",
        description: "O estoque foi atualizado com sucesso!"
      });

      console.log('Estoque salvo com sucesso para a loja:', profile.loja);
      recarregarEstoque();
    } catch (catchedError) {
      console.error('Erro geral (catch) ao salvar estoque:', catchedError);
      const errorMessage = catchedError instanceof Error ? catchedError.message : "Erro desconhecido";
      toast({
        title: "Erro interno",
        description: `Ocorreu um erro inesperado: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Fixed */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Package className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Estoque</h1>
                <p className="text-sm text-gray-500">{profile?.loja}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed Controls Section */}
      <div className="bg-white border-b flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar produto..."
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {(error || estoqueError) && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || estoqueError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Produtos</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar</span>
              </Button>
              <Button
                onClick={salvarEstoque}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Products Section */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {buscaProduto
                  ? 'Nenhum produto encontrado para sua busca.'
                  : 'Nenhum produto cadastrado'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {produtosFiltrados.map(produto => (
                <div key={produto.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {produto.display_name || 'Produto sem nome'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {produto.unidade || 'N/D'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => decrementarQuantidade(produto.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={produto.quantidade_atual === 0 ? '' : produto.quantidade_atual || ''}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (valor === '') {
                          atualizarQuantidade(produto.id, 0);
                        } else {
                          atualizarQuantidade(produto.id, parseFloat(valor) || 0);
                        }
                      }}
                      placeholder="0"
                      className="w-20 text-center"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => incrementarQuantidade(produto.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Estoque;
