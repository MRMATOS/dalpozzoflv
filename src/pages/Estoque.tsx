
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Save, AlertCircle, Plus, Minus, Search, RefreshCw, ArrowLeft, Truck, CheckCircle, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEstoque } from '@/hooks/useEstoque';
import { useProdutosComPai } from '@/hooks/useProdutosComPai';
import { useLojas } from '@/hooks/useLojas';

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
  transferencias_pendentes?: TransferenciaPendente[];
}

interface TransferenciaPendente {
  id: string;
  quantidade_transferida: number;
  loja_origem: string;
  criado_em: string;
}

const Estoque = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { estoqueProdutos, isLoading: loadingEstoqueGeral, error: estoqueError, recarregarEstoque } = useEstoque();
  const { produtos: produtosComPai, loading: loadingProdutos } = useProdutosComPai();
  const { lojas } = useLojas();
  const [produtos, setProdutos] = useState<EstoqueProduto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [buscaVisualizacao, setBuscaVisualizacao] = useState('');
  const [lojaFiltro, setLojaFiltro] = useState<string>('todas');

  useEffect(() => {
    const carregarEstoque = async () => {
      if (!profile?.loja || loadingProdutos) return;

      try {
        setLoading(true);
        setError('');

        // Buscar estoque atual
        const { data: estoqueData, error: estoqueError } = await supabase
          .from('estoque_atual')
          .select('produto_id, quantidade')
          .eq('loja', profile.loja);

        if (estoqueError) throw estoqueError;

        // Buscar transferências pendentes para esta loja
        const { data: transferenciasData, error: transferenciasError } = await supabase
          .from('transferencias')
          .select(`
            id,
            produto_id,
            quantidade_transferida,
            loja_origem,
            criado_em
          `)
          .eq('loja_destino', profile.loja)
          .eq('status', 'separado');

        if (transferenciasError) throw transferenciasError;

        const estoqueMap = new Map(estoqueData?.map(item => [item.produto_id, item.quantidade]));
        
        // Agrupar transferências por produto
        const transferenciasMap = new Map<string, TransferenciaPendente[]>();
        transferenciasData?.forEach(transfer => {
          if (!transferenciasMap.has(transfer.produto_id)) {
            transferenciasMap.set(transfer.produto_id, []);
          }
          transferenciasMap.get(transfer.produto_id)!.push({
            id: transfer.id,
            quantidade_transferida: transfer.quantidade_transferida || 0,
            loja_origem: transfer.loja_origem,
            criado_em: transfer.criado_em
          });
        });

        const produtosComEstoque = produtosComPai.map(produto => ({
          id: produto.id,
          produto: produto.produto,
          nome_variacao: produto.nome_variacao,
          produto_pai_id: produto.produto_pai_id,
          unidade: produto.unidade,
          ativo: produto.ativo,
          produto_pai_nome: produto.produto_pai_nome,
          quantidade_atual: estoqueMap.get(produto.id) || 0,
          display_name: produto.display_name,
          transferencias_pendentes: transferenciasMap.get(produto.id) || []
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

  const confirmarTransferencia = async (transferencia: TransferenciaPendente, produtoId: string) => {
    try {
      console.log('Confirmando transferência:', transferencia);

      // Atualizar status da transferência para 'recebido'
      const { error: transferError } = await supabase
        .from('transferencias')
        .update({ 
          status: 'recebido',
          confirmado_em: new Date().toISOString(),
          confirmado_por: profile?.id
        })
        .eq('id', transferencia.id);

      if (transferError) throw transferError;

      // Buscar estoque atual
      const { data: estoqueAtual, error: estoqueError } = await supabase
        .from('estoque_atual')
        .select('quantidade')
        .eq('produto_id', produtoId)
        .eq('loja', profile?.loja)
        .single();

      if (estoqueError && estoqueError.code !== 'PGRST116') throw estoqueError;

      const quantidadeAtual = estoqueAtual?.quantidade || 0;
      const novaQuantidade = quantidadeAtual + transferencia.quantidade_transferida;

      // Atualizar estoque local
      const { error: updateError } = await supabase
        .from('estoque_atual')
        .upsert({
          produto_id: produtoId,
          loja: profile?.loja,
          quantidade: novaQuantidade,
          atualizado_em: new Date().toISOString()
        }, { onConflict: 'produto_id,loja' });

      if (updateError) throw updateError;

      // Atualizar estado local
      setProdutos(prev => prev.map(produto => {
        if (produto.id === produtoId) {
          return {
            ...produto,
            quantidade_atual: novaQuantidade,
            transferencias_pendentes: produto.transferencias_pendentes?.filter(t => t.id !== transferencia.id)
          };
        }
        return produto;
      }));

      toast({ 
        title: 'Transferência confirmada!', 
        description: `${transferencia.quantidade_transferida} unidades adicionadas ao estoque` 
      });

    } catch (error: any) {
      console.error('Erro ao confirmar transferência:', error);
      toast({ 
        title: 'Erro', 
        description: `Erro ao confirmar transferência: ${error.message}`, 
        variant: 'destructive' 
      });
    }
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

  // Filtros para visualização multi-loja
  const estoquesVisualizacao = estoqueProdutos.filter(produto => {
    const termoBusca = buscaVisualizacao.toLowerCase();
    const matchesBusca = produto.produto_nome.toLowerCase().includes(termoBusca);
    
    if (lojaFiltro === 'todas') {
      return matchesBusca;
    }
    
    return matchesBusca && produto.estoques_por_loja[lojaFiltro] !== undefined;
  });

  const lojasAtivas = lojas.filter(loja => loja.ativo).map(loja => loja.nome);

  if (loading || loadingProdutos) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Package className="animate-spin w-8 h-8 text-blue-600" />
        <p className="ml-4">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Fixo */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <h1 className="text-lg font-semibold">Estoque - {profile?.loja}</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="p-2"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Alertas */}
      {(error || estoqueError) && (
        <Alert variant="destructive" className="mx-4 mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || estoqueError}</AlertDescription>
        </Alert>
      )}

      {/* Conteúdo Principal com Abas */}
      <main className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="meu-estoque" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meu-estoque" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Meu Estoque
            </TabsTrigger>
            <TabsTrigger value="visualizar-estoques" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Visualizar Estoques
            </TabsTrigger>
          </TabsList>

          {/* Aba: Meu Estoque */}
          <TabsContent value="meu-estoque" className="mt-4">
            {/* Controles da Aba Meu Estoque */}
            <div className="bg-white border rounded-lg p-4 mb-4 sticky top-0 z-30">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar produto..."
                    value={buscaProduto}
                    onChange={(e) => setBuscaProduto(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  onClick={salvarEstoque} 
                  disabled={saving} 
                  className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>

            {/* Lista de Produtos Editável */}
            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Nenhum produto encontrado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {produtosFiltrados.map(produto => (
                  <Card key={produto.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{produto.display_name}</h3>
                          <p className="text-sm text-gray-500">{produto.unidade || 'N/D'}</p>
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
                            value={produto.quantidade_atual === 0 ? '' : produto.quantidade_atual || ''}
                            onChange={(e) => atualizarQuantidade(produto.id, parseFloat(e.target.value) || 0)}
                            className="w-20 text-center h-8 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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

                      {/* Seção de Transferências Pendentes */}
                      {produto.transferencias_pendentes && produto.transferencias_pendentes.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center mb-3">
                            <Truck className="h-4 w-4 text-blue-600 mr-2" />
                            <h4 className="text-sm font-medium text-gray-700">Transferências Pendentes</h4>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {produto.transferencias_pendentes.length}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {produto.transferencias_pendentes.map(transferencia => (
                              <div key={transferencia.id} className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-blue-900">
                                      {transferencia.quantidade_transferida} {produto.unidade?.toLowerCase()}
                                    </span>
                                    <span className="text-xs text-blue-600">
                                      de {transferencia.loja_origem}
                                    </span>
                                  </div>
                                  <p className="text-xs text-blue-600 mt-1">
                                    {new Date(transferencia.criado_em).toLocaleDateString('pt-BR')} às{' '}
                                    {new Date(transferencia.criado_em).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => confirmarTransferencia(transferencia, produto.id)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Confirmar
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba: Visualizar Estoques */}
          <TabsContent value="visualizar-estoques" className="mt-4">
            {/* Controles da Aba Visualização */}
            <div className="bg-white border rounded-lg p-4 mb-4 sticky top-0 z-30">
              <div className="flex gap-3 items-center flex-wrap">
                <div className="relative flex-1 min-w-64">
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar produto..."
                    value={buscaVisualizacao}
                    onChange={(e) => setBuscaVisualizacao(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                  <SelectTrigger className="w-52">
                    <SelectValue placeholder="Selecionar loja" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Lojas</SelectItem>
                    {lojasAtivas.map(loja => (
                      <SelectItem key={loja} value={loja}>{loja}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loadingEstoqueGeral ? (
              <div className="text-center py-8">
                <Package className="animate-spin w-8 h-8 mx-auto text-blue-600 mb-4" />
                <p className="text-gray-500">Carregando estoques...</p>
              </div>
            ) : (
              <>
                {/* Visualização Desktop */}
                {lojaFiltro === 'todas' ? (
                  <div className="hidden md:block">
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produto</TableHead>
                              <TableHead>Unidade</TableHead>
                              {lojasAtivas.map(loja => (
                                <TableHead key={loja}>{loja}</TableHead>
                              ))}
                              <TableHead>Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {estoquesVisualizacao.map(produto => (
                              <TableRow key={produto.produto_id}>
                                <TableCell className="font-medium">{produto.produto_nome}</TableCell>
                                <TableCell>{produto.unidade}</TableCell>
                                {lojasAtivas.map(loja => (
                                  <TableCell key={loja}>
                                    {produto.estoques_por_loja[loja] || 0}
                                  </TableCell>
                                ))}
                                <TableCell className="font-semibold">
                                  {produto.total_estoque}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}

                {/* Visualização Mobile ou Loja Individual */}
                <div className={lojaFiltro === 'todas' ? 'block md:hidden' : 'block'}>
                  {estoquesVisualizacao.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Nenhum produto encontrado.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {estoquesVisualizacao.map(produto => (
                        <Card key={produto.produto_id} className="shadow-sm">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900">{produto.produto_nome}</h3>
                                  <p className="text-sm text-gray-500">Unidade: {produto.unidade}</p>
                                </div>
                                {lojaFiltro === 'todas' && (
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-blue-600">
                                      Total: {produto.total_estoque}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2">
                                {lojaFiltro === 'todas' ? (
                                  lojasAtivas.map(loja => (
                                    <div key={loja} className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded">
                                      <span className="text-sm text-gray-600">{loja}:</span>
                                      <span className="font-medium">
                                        {produto.estoques_por_loja[loja] || 0} {produto.unidade?.toLowerCase()}
                                      </span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded">
                                    <span className="text-sm text-blue-600">{lojaFiltro}:</span>
                                    <span className="font-semibold text-blue-900">
                                      {produto.estoques_por_loja[lojaFiltro] || 0} {produto.unidade?.toLowerCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Estoque;
