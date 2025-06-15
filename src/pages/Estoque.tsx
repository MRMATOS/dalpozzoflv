import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Save, AlertCircle, Plus, Minus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Produto {
  id: string;
  produto: string;
  unidade: string;
  quantidade_atual?: number;
}

const Estoque = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  // Carregar produtos e estoque atual
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoading(true);
        console.log('Carregando produtos para a loja:', profile?.loja);

        // Buscar produtos ativos
        const { data: produtosData, error: produtosError } = await supabase
          .from('produtos')
          .select('id, produto, unidade')
          .eq('ativo', true)
          .order('produto');

        if (produtosError) {
          console.error('Erro ao carregar produtos:', produtosError);
          setError('Erro ao carregar produtos');
          return;
        }

        // Buscar estoque atual da loja
        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_atual')
          .select('produto_id, quantidade')
          .eq('loja', profile?.loja);

        if (estoqueError) {
          console.error('Erro ao carregar estoque:', estoqueError);
          setError('Erro ao carregar estoque atual');
          return;
        }

        // Mapear estoque por produto_id
        const estoqueMap = new Map();
        estoqueData?.forEach(item => {
          estoqueMap.set(item.produto_id, item.quantidade);
        });

        // Combinar produtos com estoque atual
        const produtosComEstoque = produtosData?.map(produto => ({
          ...produto,
          quantidade_atual: estoqueMap.get(produto.id) || 0
        })) || [];

        setProdutos(produtosComEstoque);
        console.log('Produtos carregados:', produtosComEstoque);
      } catch (error) {
        console.error('Erro geral:', error);
        setError('Erro interno ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    if (profile?.loja) {
      carregarProdutos();
    }
  }, [profile]);

  const produtosFiltrados = produtos.filter(p =>
    p.produto.toLowerCase().includes(buscaProduto.toLowerCase())
  );

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
        title: "Erro",
        description: "Informação da loja não encontrada.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Salvando estoque para a loja:', profile.loja);

      // Preparar dados para upsert
      const dadosEstoque = produtos.map(produto => ({
        produto_id: produto.id,
        loja: profile.loja,
        quantidade: produto.quantidade_atual || 0,
        atualizado_em: new Date().toISOString()
      }));

      console.log('Dados para salvar:', dadosEstoque);

      // Fazer upsert (insert ou update)
      const { error } = await supabase
        .from('estoque_atual')
        .upsert(dadosEstoque, {
          onConflict: 'produto_id,loja'
        });

      if (error) {
        console.error('Erro ao salvar estoque:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o estoque. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Estoque salvo",
        description: "O estoque foi atualizado com sucesso!"
      });

      console.log('Estoque salvo com sucesso para a loja:', profile.loja);
    } catch (error) {
      console.error('Erro geral ao salvar:', error);
      toast({
        title: "Erro interno",
        description: "Erro interno ao salvar estoque.",
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
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
                <h1 className="text-lg font-semibold text-gray-900">Controle de Estoque</h1>
                <p className="text-sm text-gray-500">{profile?.loja}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.tipo} - {profile?.loja}</p>
              </div>
              <Button variant="outline" onClick={signOut} size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Atualizar Estoque
          </h2>
          <p className="text-gray-600">
            Atualize as quantidades disponíveis dos produtos em sua loja.
          </p>
        </div>

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

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Produtos da Loja</CardTitle>
              <CardDescription>
                Digite a quantidade atual de cada produto em estoque
              </CardDescription>
            </div>
            <Button
              onClick={salvarEstoque}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Estoque'}
            </Button>
          </CardHeader>
          <CardContent>
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
                  <div key={produto.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{produto.produto}</h3>
                      <p className="text-sm text-gray-500">Unidade: {produto.unidade}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">
                          Quantidade:
                        </label>
                        <div className="flex items-center space-x-1">
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Estoque;
