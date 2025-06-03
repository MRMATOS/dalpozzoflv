
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Package, Save, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Produto {
  id: string;
  produto: string;
  unidade: string;
}

interface EstoqueItem {
  produto_id: string;
  loja: string;
  quantidade: number;
  unidade: string;
}

const EstoqueCotacao = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [estoques, setEstoques] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const lojas = ['Loja 1', 'Loja 2', 'Loja 3']; // Pode vir do banco depois

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        console.log('Carregando produtos e estoque de cotação...');

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

        // Buscar estoque de cotação atual
        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_cotacao')
          .select('produto_id, loja, quantidade, unidade');

        if (estoqueError) {
          console.error('Erro ao carregar estoque:', estoqueError);
          setError('Erro ao carregar estoque atual');
          return;
        }

        setProdutos(produtosData || []);
        setEstoques(estoqueData || []);

        console.log('Dados carregados:', { produtos: produtosData, estoques: estoqueData });
      } catch (error) {
        console.error('Erro geral:', error);
        setError('Erro interno ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const obterEstoque = (produtoId: string, loja: string) => {
    const estoque = estoques.find(e => e.produto_id === produtoId && e.loja === loja);
    return estoque ? { quantidade: estoque.quantidade, unidade: estoque.unidade } : { quantidade: 0, unidade: 'Kg' };
  };

  const atualizarEstoque = (produtoId: string, loja: string, quantidade: number, unidade: string) => {
    setEstoques(prev => {
      const index = prev.findIndex(e => e.produto_id === produtoId && e.loja === loja);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], quantidade, unidade };
        return updated;
      } else {
        return [...prev, { produto_id: produtoId, loja, quantidade, unidade }];
      }
    });
  };

  const salvarEstoques = async () => {
    try {
      setSaving(true);
      console.log('Salvando estoques de cotação...');

      const dadosParaSalvar = estoques.map(estoque => ({
        produto_id: estoque.produto_id,
        loja: estoque.loja,
        quantidade: estoque.quantidade,
        unidade: estoque.unidade,
        data_atualizacao: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('estoque_cotacao')
        .upsert(dadosParaSalvar, {
          onConflict: 'produto_id,loja'
        });

      if (error) {
        console.error('Erro ao salvar estoques:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar os estoques. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Estoques salvos",
        description: "Os estoques de cotação foram atualizados com sucesso!"
      });
    } catch (error) {
      console.error('Erro geral ao salvar:', error);
      toast({
        title: "Erro interno",
        description: "Erro interno ao salvar estoques.",
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Estoque para Cotação</h1>
                <p className="text-sm text-gray-500">Informar quantidades disponíveis</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.tipo}</p>
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
            Atualizar Estoque para Cotação
          </h2>
          <p className="text-gray-600">
            Informe as quantidades disponíveis de cada produto por loja para uso nas cotações.
          </p>
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
              <CardTitle>Estoque por Produto e Loja</CardTitle>
              <CardDescription>
                Configure as quantidades disponíveis para cada produto em cada loja
              </CardDescription>
            </div>
            <Button
              onClick={salvarEstoques}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Estoques'}
            </Button>
          </CardHeader>
          <CardContent>
            {produtos.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum produto cadastrado</p>
              </div>
            ) : (
              <div className="space-y-6">
                {produtos.map(produto => (
                  <div key={produto.id} className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-4">{produto.produto}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {lojas.map(loja => {
                        const estoque = obterEstoque(produto.id, loja);
                        return (
                          <div key={loja} className="flex flex-col space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              {loja}
                            </label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={estoque.quantidade}
                                onChange={(e) => atualizarEstoque(
                                  produto.id,
                                  loja,
                                  parseFloat(e.target.value) || 0,
                                  estoque.unidade
                                )}
                                className="flex-1"
                              />
                              <Select
                                value={estoque.unidade}
                                onValueChange={(unidade) => atualizarEstoque(
                                  produto.id,
                                  loja,
                                  estoque.quantidade,
                                  unidade
                                )}
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Kg">Kg</SelectItem>
                                  <SelectItem value="Caixa">Cx</SelectItem>
                                  <SelectItem value="Unidade">Un</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
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

export default EstoqueCotacao;
