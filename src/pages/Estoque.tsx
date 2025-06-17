
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Save, AlertCircle, Plus, Minus, Search, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEstoque } from '@/hooks/useEstoque';
import { useProdutosComPai } from '@/hooks/useProdutosComPai';

interface EstoqueProduto {
  id: string;
  produto: string | null;
  nome_variacao: string | null;
  produto_pai_id: string | null;
  unidade: string | null;
  ativo: boolean | null;
  quantidade_atual?: number;
  display_name?: string;
  produto_pai_nome?: string | null;
}

const Estoque = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { error: estoqueError, recarregarEstoque } = useEstoque();
  const { produtos: produtosComPai, loading: loadingProdutos } = useProdutosComPai();
  const [produtos, setProdutos] = useState<EstoqueProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  useEffect(() => {
    const carregarEstoque = async () => {
      if (!profile?.loja || loadingProdutos) return;

      try {
        setLoading(true);
        setError('');

        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_atual')
          .select('produto_id, quantidade')
          .eq('loja', profile.loja);

        if (estoqueError) throw estoqueError;

        const estoqueMap = new Map(estoqueData?.map(item => [item.produto_id, item.quantidade]));

        const produtosComEstoque = produtosComPai.map(produto => ({
          id: produto.id,
          produto: produto.produto,
          nome_variacao: produto.nome_variacao,
          produto_pai_id: produto.produto_pai_id,
          unidade: produto.unidade,
          ativo: produto.ativo,
          produto_pai_nome: produto.produto_pai_nome,
          quantidade_atual: estoqueMap.get(produto.id) || 0,
          display_name: produto.display_name
        }));

        produtosComEstoque.sort((a, b) => {
          const nomePaiA = a.produto_pai_nome || a.produto || '';
          const nomePaiB = b.produto_pai_nome || b.produto || '';

          const comparePai = nomePaiA.localeCompare(nomePaiB);
          if (comparePai !== 0) return comparePai;

          const ehVariacaoA = !!a.nome_variacao;
          const ehVariacaoB = !!b.nome_variacao;

          if (!ehVariacaoA && ehVariacaoB) return -1;
          if (ehVariacaoA && !ehVariacaoB) return 1;

          const nomeA = a.display_name || '';
          const nomeB = b.display_name || '';
          return nomeA.localeCompare(nomeB);
        });

        setProdutos(produtosComEstoque);
      } catch (error: any) {
        setError(`Erro: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    carregarEstoque();
  }, [profile, produtosComPai, loadingProdutos]);

  const atualizarQuantidade = (produtoId: string, quantidade: number) => {
    setProdutos(prev => prev.map(produto =>
      produto.id === produtoId ? { ...produto, quantidade_atual: Math.max(0, quantidade) } : produto
    ));
  };

  const incrementarQuantidade = (produtoId: string) => {
    atualizarQuantidade(produtoId, (produtos.find(p => p.id === produtoId)?.quantidade_atual || 0) + 1);
  };

  const decrementarQuantidade = (produtoId: string) => {
    atualizarQuantidade(produtoId, Math.max(0, (produtos.find(p => p.id === produtoId)?.quantidade_atual || 0) - 1));
  };

  const salvarEstoque = async () => {
    if (!profile?.loja) return;

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
        .upsert(dadosEstoque, { onConflict: 'produto_id,loja' });

      if (error) throw error;

      toast({ title: 'Estoque salvo!', description: 'O estoque foi atualizado com sucesso!' });
      recarregarEstoque();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const produtosFiltrados = produtos.filter(p => {
    const termoBusca = buscaProduto.toLowerCase();
    return (
      p.display_name?.toLowerCase().includes(termoBusca) ||
      p.produto?.toLowerCase().includes(termoBusca) ||
      p.nome_variacao?.toLowerCase().includes(termoBusca) ||
      p.produto_pai_nome?.toLowerCase().includes(termoBusca)
    );
  });

  if (loading || loadingProdutos) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Package className="animate-spin w-8 h-8 text-blue-600" />
        <p className="ml-4">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <h1 className="text-lg font-semibold">Estoque - {profile?.loja}</h1>
          </div>
        </div>
      </header>

      <div className="bg-white border-b p-4">
        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar produto..."
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4" /> Atualizar
            </Button>
            <Button onClick={salvarEstoque} disabled={saving} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </div>

      {(error || estoqueError) && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || estoqueError}</AlertDescription>
        </Alert>
      )}

      <main className="flex-1 overflow-auto p-4">
        {produtosFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum produto encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {produtosFiltrados.map(produto => (
              <div key={produto.id} className="flex items-center justify-between p-4 border rounded-lg bg-white">
                <div>
                  <h3 className="font-medium text-gray-900">{produto.display_name}</h3>
                  <p className="text-sm text-gray-500">{produto.unidade || 'N/D'}</p>
                  {produto.produto_pai_nome && (
                    <p className="text-xs text-blue-600">
                      {produto.produto_pai_nome} → {produto.nome_variacao}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => decrementarQuantidade(produto.id)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="0"
                    value={produto.quantidade_atual === 0 ? '' : produto.quantidade_atual || ''}
                    onChange={(e) => atualizarQuantidade(produto.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <Button variant="outline" size="sm" onClick={() => incrementarQuantidade(produto.id)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Estoque;
