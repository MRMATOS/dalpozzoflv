
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import ProdutoFilters from './ProdutoFilters';
import ProdutoCard from './ProdutoCard';

const unidades = ['Bandeja', 'Caixa', 'Gaiola', 'Gr', 'Kg', 'Maço', 'Pacote', 'Saco', 'Unidade'];

interface Produto {
  id: string;
  produto: string;
  nome_variacao?: string;
  unidade: string;
  ativo: boolean;
  media_por_caixa: number | null;
  produto_pai_id: string | null;
  ordem_exibicao: number;
}

interface ProdutoHierarquico extends Produto {
  variacoes?: Produto[];
  expandido?: boolean;
}

const ProdutosTab = () => {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [addingVariationTo, setAddingVariationTo] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    produto: Produto | null;
    title: string;
    description: string;
  }>({
    open: false,
    produto: null,
    title: '',
    description: ''
  });
  const [newProduct, setNewProduct] = useState({
    produto: '',
    nome_variacao: '',
    unidade: 'Kg',
    media_por_caixa: 20,
    ativo: true,
    tipo: 'principal' as 'principal' | 'variacao',
    produto_pai_id: null as string | null
  });
  const [newVariation, setNewVariation] = useState({
    nome_variacao: '',
    unidade: 'Kg',
    media_por_caixa: 20,
    ativo: true
  });
  const [showNewProduct, setShowNewProduct] = useState(false);

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('todos');
  const [stockFilter, setStockFilter] = useState('todos');
  const [mediaFilter, setMediaFilter] = useState('todos');

  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ['produtos-hierarquicos'],
    queryFn: async () => {
      console.log('Buscando produtos hierárquicos...');
      
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('produto');
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
      }
      
      // Organizar produtos em hierarquia
      const produtosPrincipais: ProdutoHierarquico[] = [];
      const variacoes: Produto[] = [];
      
      data?.forEach(produto => {
        if (produto.produto_pai_id === null) {
          produtosPrincipais.push({ ...produto, variacoes: [], expandido: false });
        } else {
          variacoes.push(produto);
        }
      });
      
      // Associar variações aos produtos principais
      variacoes.forEach(variacao => {
        const produtoPrincipal = produtosPrincipais.find(p => p.id === variacao.produto_pai_id);
        if (produtoPrincipal) {
          if (!produtoPrincipal.variacoes) produtoPrincipal.variacoes = [];
          produtoPrincipal.variacoes.push(variacao);
        }
      });
      
      // Ordenar variações por ordem_exibicao
      produtosPrincipais.forEach(produto => {
        if (produto.variacoes) {
          produto.variacoes.sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0));
        }
      });
      
      console.log('Produtos hierárquicos organizados:', produtosPrincipais);
      return produtosPrincipais;
    },
  });

  const produtosPrincipais = produtos?.filter(p => p.produto_pai_id === null) || [];

  // Aplicar filtros
  const produtosFiltrados = produtos?.filter(produto => {
    // Filtro de busca
    const nomeCompleto = produto.produto_pai_id 
      ? produto.nome_variacao?.toLowerCase() || ''
      : produto.produto.toLowerCase();
    
    if (searchTerm && !nomeCompleto.includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro de tipo
    if (typeFilter === 'principais' && produto.produto_pai_id !== null) return false;
    if (typeFilter === 'variacoes' && produto.produto_pai_id === null) return false;

    // Filtro de estoque definido
    if (stockFilter === 'com-estoque' && !produto.unidade) return false;
    if (stockFilter === 'sem-estoque' && produto.unidade) return false;

    // Filtro de média por caixa
    const temMedia = produto.media_por_caixa !== null && produto.unidade?.toLowerCase() === 'caixa';
    if (mediaFilter === 'com-media' && !temMedia) return false;
    if (mediaFilter === 'sem-media' && temMedia) return false;

    return true;
  }) || [];

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      console.log('Atualizando produto:', id, updates);
      const { error } = await supabase
        .from('produtos')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-hierarquicos'] });
      toast.success('Produto atualizado com sucesso!');
      setEditingProduct(null);
    },
    onError: (error) => {
      console.error('Erro ao atualizar produto:', error);
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (produto: any) => {
      console.log('Criando produto:', produto);
      const { data, error } = await supabase
        .from('produtos')
        .insert([produto])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-hierarquicos'] });
      toast.success('Produto criado com sucesso!');
      setNewProduct({ 
        produto: '', 
        nome_variacao: '', 
        unidade: 'Kg', 
        media_por_caixa: 20, 
        ativo: true, 
        tipo: 'principal',
        produto_pai_id: null 
      });
      setShowNewProduct(false);
    },
    onError: (error) => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });

  const createVariationMutation = useMutation({
    mutationFn: async ({ produtoPaiId, variacao }: { produtoPaiId: string; variacao: any }) => {
      console.log('Criando variação:', produtoPaiId, variacao);
      
      // Calcular próxima ordem de exibição
      const produtoPai = produtos?.find(p => p.id === produtoPaiId);
      const ordemExibicao = (produtoPai?.variacoes?.length || 0) + 1;
      
      const variacaoData = {
        ...variacao,
        produto_pai_id: produtoPaiId,
        ordem_exibicao: ordemExibicao,
        media_por_caixa: mostrarMediaPorCaixa(variacao.unidade) ? variacao.media_por_caixa : null
      };
      
      const { data, error } = await supabase
        .from('produtos')
        .insert([variacaoData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-hierarquicos'] });
      toast.success('Variação criada com sucesso!');
      setNewVariation({
        nome_variacao: '',
        unidade: 'Kg',
        media_por_caixa: 20,
        ativo: true
      });
      setAddingVariationTo(null);
    },
    onError: (error) => {
      console.error('Erro ao criar variação:', error);
      toast.error('Erro ao criar variação: ' + error.message);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (produtoId: string) => {
      console.log('Excluindo produto:', produtoId);
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produtoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos-hierarquicos'] });
      toast.success('Produto excluído com sucesso!');
      setDeleteDialog({ open: false, produto: null, title: '', description: '' });
    },
    onError: (error) => {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto: ' + error.message);
      setDeleteDialog({ open: false, produto: null, title: '', description: '' });
    },
  });

  const toggleExpanded = (produtoId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(produtoId)) {
      newExpanded.delete(produtoId);
    } else {
      newExpanded.add(produtoId);
    }
    setExpandedProducts(newExpanded);
  };

  const mostrarMediaPorCaixa = (unidade: string) => {
    return unidade.toLowerCase() === 'caixa';
  };

  const contarTotalProdutos = () => {
    const principais = produtos?.length || 0;
    const totalVariacoes = produtos?.reduce((acc, p) => acc + (p.variacoes?.length || 0), 0) || 0;
    return { principais, total: principais + totalVariacoes };
  };

  const handleCreateProduct = () => {
    const produtoData: any = {
      produto: newProduct.produto,
      unidade: newProduct.unidade,
      ativo: newProduct.ativo,
      media_por_caixa: mostrarMediaPorCaixa(newProduct.unidade) ? newProduct.media_por_caixa : null,
      produto_pai_id: newProduct.tipo === 'variacao' ? newProduct.produto_pai_id : null,
    };

    if (newProduct.tipo === 'variacao') {
      produtoData.nome_variacao = newProduct.nome_variacao;
      // Calcular próxima ordem de exibição
      const produtoPai = produtos?.find(p => p.id === newProduct.produto_pai_id);
      produtoData.ordem_exibicao = (produtoPai?.variacoes?.length || 0) + 1;
    }

    createProductMutation.mutate(produtoData);
  };

  const handleDeleteClick = (produto: Produto) => {
    const isVariacao = produto.produto_pai_id !== null;
    const produtoPrincipal = isVariacao ? null : produtos?.find(p => p.id === produto.id);
    const temVariacoes = produtoPrincipal?.variacoes && produtoPrincipal.variacoes.length > 0;

    if (!isVariacao && temVariacoes) {
      setDeleteDialog({
        open: true,
        produto,
        title: 'Não é possível excluir',
        description: `O produto "${produto.produto}" possui ${produtoPrincipal?.variacoes?.length} variação(ões) ativa(s). Exclua todas as variações primeiro.`
      });
      return;
    }

    const nomeExibicao = isVariacao ? produto.nome_variacao : produto.produto;
    const tipo = isVariacao ? 'variação' : 'produto';

    setDeleteDialog({
      open: true,
      produto,
      title: `Confirmar exclusão`,
      description: `Tem certeza que deseja excluir ${tipo} "${nomeExibicao}"? Esta ação não pode ser desfeita.`
    });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.produto) {
      deleteProductMutation.mutate(deleteDialog.produto.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando produtos...</span>
      </div>
    );
  }

  if (error) {
    console.error('Erro na query de produtos:', error);
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar produtos:</p>
          <p className="text-sm text-gray-600">{error.message}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['produtos-hierarquicos'] })}
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const { principais, total } = contarTotalProdutos();

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base md:text-lg">
            <div className="flex flex-col">
              <span>{principais} produtos</span>
              <span className="text-sm text-gray-500 font-normal">{total - principais} variações</span>
            </div>
          </CardTitle>
          <Button onClick={() => setShowNewProduct(true)} disabled={showNewProduct} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          <ProdutoFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            stockFilter={stockFilter}
            onStockFilterChange={setStockFilter}
            mediaFilter={mediaFilter}
            onMediaFilterChange={setMediaFilter}
          />

          {showNewProduct && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-4">Novo Produto</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Tipo de Produto</Label>
                  <RadioGroup 
                    value={newProduct.tipo} 
                    onValueChange={(value: 'principal' | 'variacao') => {
                      setNewProduct({ 
                        ...newProduct, 
                        tipo: value, 
                        produto_pai_id: value === 'principal' ? null : newProduct.produto_pai_id 
                      });
                    }}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="principal" id="principal" />
                      <Label htmlFor="principal">Produto Principal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="variacao" id="variacao" />
                      <Label htmlFor="variacao">Variação</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {newProduct.tipo === 'variacao' && (
                    <Select 
                      value={newProduct.produto_pai_id || ''} 
                      onValueChange={(value) => setNewProduct({ ...newProduct, produto_pai_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar produto principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {produtosPrincipais.map((produto) => (
                          <SelectItem key={produto.id} value={produto.id}>
                            {produto.produto}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Input
                    placeholder={newProduct.tipo === 'variacao' ? "Nome da variação" : "Nome do produto"}
                    value={newProduct.tipo === 'variacao' ? newProduct.nome_variacao : newProduct.produto}
                    onChange={(e) => {
                      if (newProduct.tipo === 'variacao') {
                        setNewProduct({ ...newProduct, nome_variacao: e.target.value });
                      } else {
                        setNewProduct({ ...newProduct, produto: e.target.value });
                      }
                    }}
                  />

                  <Select value={newProduct.unidade} onValueChange={(value) => {
                    setNewProduct({ 
                      ...newProduct, 
                      unidade: value,
                      media_por_caixa: value.toLowerCase() === 'caixa' ? 20 : 1
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((unidade) => (
                        <SelectItem key={unidade} value={unidade}>
                          {unidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {mostrarMediaPorCaixa(newProduct.unidade) && (
                    <Input
                      type="number"
                      placeholder="Média por caixa (kg)"
                      value={newProduct.media_por_caixa}
                      onChange={(e) => setNewProduct({ ...newProduct, media_por_caixa: parseFloat(e.target.value) || 0 })}
                    />
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={newProduct.ativo}
                      onCheckedChange={(checked) => setNewProduct({ ...newProduct, ativo: checked })}
                    />
                    <span className="text-sm">Ativo</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCreateProduct}
                      disabled={
                        (!newProduct.produto && newProduct.tipo === 'principal') ||
                        (!newProduct.nome_variacao && newProduct.tipo === 'variacao') ||
                        (newProduct.tipo === 'variacao' && !newProduct.produto_pai_id) ||
                        createProductMutation.isPending
                      }
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {createProductMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar
                    </Button>
                    <Button variant="outline" onClick={() => setShowNewProduct(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {produtosFiltrados.map((produto) => (
              <ProdutoCard
                key={produto.id}
                produto={produto}
                isExpanded={expandedProducts.has(produto.id)}
                onToggleExpanded={() => toggleExpanded(produto.id)}
                onEdit={(produto) => setEditingProduct(produto.id)}
                onDelete={handleDeleteClick}
                onUpdate={(id, updates) => updateProductMutation.mutate({ id, updates })}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
                onAddVariation={(produtoId) => setAddingVariationTo(produtoId)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleConfirmDelete}
        title={deleteDialog.title}
        description={deleteDialog.description}
        isLoading={deleteProductMutation.isPending}
      />
    </>
  );
};

export default ProdutosTab;
