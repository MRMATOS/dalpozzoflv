import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Save, AlertCircle, Plus, Minus } from 'lucide-react';
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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollPosition = useRef(0);
  const productsContainerRef = useRef<HTMLDivElement>(null);

  // Carregar produtos e estoque atual
  useEffect(() => {
    const carregarProdutos = async () => {
      try {
        setLoading(true);
        console.log('Carregando produtos para a loja:', profile?.loja);

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

        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_atual')
          .select('produto_id, quantidade')
          .eq('loja', profile?.loja);

        if (estoqueError) {
          console.error('Erro ao carregar estoque:', estoqueError);
          setError('Erro ao carregar estoque atual');
          return;
        }

        const estoqueMap = new Map();
        estoqueData?.forEach(item => {
          estoqueMap.set(item.produto_id, item.quantidade);
        });

        const produtosComEstoque = produtosData?.map(produto => ({
          ...produto,
          quantidade_atual: estoqueMap.get(produto.id) || 0
        })) || [];

        setProdutos(produtosComEstoque);
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

  // Controle do scroll para mostrar/esconder header
  useEffect(() => {
    const container = productsContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollPosition = container.scrollTop;
      const scrollDirection = currentScrollPosition > lastScrollPosition.current ? 'down' : 'up';
      
      if (scrollDirection === 'up') {
        setIsHeaderVisible(true);
      } 
      else if (scrollDirection === 'down' && currentScrollPosition > 10) {
        setIsHeaderVisible(false);
      }

      lastScrollPosition.current = currentScrollPosition;
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Restante das funções permanecem iguais
  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    setProdutos(prev => prev.map(produto => 
      produto.id === produtoId ? {
        ...produto,
        quantidade_atual: Math.max(0, quantidade)
      } : produto
    ));
  };

  const incrementarQuantidade = (produtoId: string) => {
    setProdutos(prev => prev.map(produto => 
      produto.id === produtoId ? {
        ...produto,
        quantidade_atual: (produto.quantidade_atual || 0) + 1
      } : produto
    ));
  };

  const decrementarQuantidade = (produtoId: string) => {
    setProdutos(prev => prev.map(produto => 
      produto.id === produtoId ? {
        ...produto,
        quantidade_atual: Math.max(0, (produto.quantidade_atual || 0) - 1)
      } : produto
    ));
  };

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
      const dadosEstoque = produtos.map(produto => ({
        produto_id: produto.id,
        loja: profile.loja,
        quantidade: produto.quantidade_atual || 0,
        atualizado_em: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('estoque_atual')
        .upsert(dadosEstoque, {
          onConflict: 'produto_id,loja'
        });

      if (error) throw error;

      toast({
        title: "Estoque salvo",
        description: "O estoque foi atualizado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o estoque. Tente novamente.",
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
      {/* Header */}
      <header className={`bg-white shadow-sm border-b transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'} fixed w-full z-20`}>
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
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col w-full mt-16">
        {/* Seção de título e botão salvar */}
        <div className="mb-6 flex justify-between items-center sticky top-16 z-10 bg-gray-50 pt-4 pb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Atualizar estoque
          </h2>
          <Button
            onClick={salvarEstoque}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 shrink-0"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Lista de produtos - Estilo igual ao da requisição */}
        <div 
          ref={productsContainerRef}
          className="flex-1 overflow-y-auto space-y-3 pb-4"
        >
          {produtos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum produto cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            produtos.map(produto => (
              <div key={produto.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{produto.produto}</h3>
                    <p className="text-sm text-gray-500">Unidade: {produto.unidade}</p>
                  </div>
                  <div className="flex items-center space-x-4">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Estoque;