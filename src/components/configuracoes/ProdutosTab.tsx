import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Plus, Save, ChevronRight, ChevronDown } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [newProduct, setNewProduct] = useState({
    produto: '',
    nome_variacao: '',
    unidade: 'Kg',
    media_por_caixa: 20,
    ativo: true,
    tipo: 'principal' as 'principal' | 'variacao',
    produto_pai_id: null as string | null
  });
  const [showNewProduct, setShowNewProduct] = useState(false);

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Produtos Principais ({principais}) - Total com variações ({total})
        </CardTitle>
        <Button onClick={() => setShowNewProduct(true)} disabled={showNewProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </CardHeader>
      <CardContent>
        {showNewProduct && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Tipo do Estoque</TableHead>
              <TableHead>Média por Caixa (kg)</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos?.map((produto) => (
              <React.Fragment key={produto.id}>
                {/* Linha do produto principal */}
                <TableRow className="bg-slate-50">
                  <TableCell>
                    {produto.variacoes && produto.variacoes.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(produto.id)}
                        className="p-1 h-6 w-6"
                      >
                        {expandedProducts.has(produto.id) ? 
                          <ChevronDown className="h-4 w-4" /> : 
                          <ChevronRight className="h-4 w-4" />
                        }
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {editingProduct === produto.id ? (
                      <Input
                        defaultValue={produto.produto}
                        onBlur={(e) => {
                          if (e.target.value !== produto.produto) {
                            updateProductMutation.mutate({
                              id: produto.id,
                              updates: { produto: e.target.value }
                            });
                          }
                        }}
                      />
                    ) : (
                      <>
                        {produto.produto}
                        {produto.variacoes && produto.variacoes.length > 0 && (
                          <span className="ml-2 text-sm text-gray-500">
                            ({produto.variacoes.length} variações)
                          </span>
                        )}
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingProduct === produto.id ? (
                      <Select
                        defaultValue={produto.unidade}
                        onValueChange={(value) => {
                          updateProductMutation.mutate({
                            id: produto.id,
                            updates: { 
                              unidade: value,
                              media_por_caixa: value.toLowerCase() === 'caixa' ? (produto.media_por_caixa || 20) : null
                            }
                          });
                        }}
                      >
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
                    ) : (
                      produto.unidade
                    )}
                  </TableCell>
                  <TableCell>
                    {mostrarMediaPorCaixa(produto.unidade || '') ? (
                      editingProduct === produto.id ? (
                        <Input
                          type="number"
                          defaultValue={produto.media_por_caixa || 20}
                          className="w-24"
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value) || null;
                            updateProductMutation.mutate({
                              id: produto.id,
                              updates: { media_por_caixa: value }
                            });
                          }}
                        />
                      ) : (
                        `${produto.media_por_caixa || 20} kg`
                      )
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={produto.ativo}
                      onCheckedChange={(checked) => {
                        updateProductMutation.mutate({
                          id: produto.id,
                          updates: { ativo: checked }
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProduct(editingProduct === produto.id ? null : produto.id)}
                    >
                      {editingProduct === produto.id ? 'Finalizar' : 'Editar'}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Linhas das variações (se expandido) */}
                {expandedProducts.has(produto.id) && produto.variacoes?.map((variacao) => (
                  <TableRow key={variacao.id} className="bg-white">
                    <TableCell></TableCell>
                    <TableCell className="pl-8">
                      <span className="text-gray-600">├─ </span>
                      {editingProduct === variacao.id ? (
                        <Input
                          defaultValue={variacao.nome_variacao}
                          onBlur={(e) => {
                            if (e.target.value !== variacao.nome_variacao) {
                              updateProductMutation.mutate({
                                id: variacao.id,
                                updates: { nome_variacao: e.target.value }
                              });
                            }
                          }}
                        />
                      ) : (
                        variacao.nome_variacao
                      )}
                    </TableCell>
                    <TableCell>
                      {editingProduct === variacao.id ? (
                        <Select
                          defaultValue={variacao.unidade}
                          onValueChange={(value) => {
                            updateProductMutation.mutate({
                              id: variacao.id,
                              updates: { 
                                unidade: value,
                                media_por_caixa: value.toLowerCase() === 'caixa' ? (variacao.media_por_caixa || 20) : null
                              }
                            });
                          }}
                        >
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
                      ) : (
                        variacao.unidade
                      )}
                    </TableCell>
                    <TableCell>
                      {mostrarMediaPorCaixa(variacao.unidade || '') ? (
                        editingProduct === variacao.id ? (
                          <Input
                            type="number"
                            defaultValue={variacao.media_por_caixa || 20}
                            className="w-24"
                            onBlur={(e) => {
                              const value = parseFloat(e.target.value) || null;
                              updateProductMutation.mutate({
                                id: variacao.id,
                                updates: { media_por_caixa: value }
                              });
                            }}
                          />
                        ) : (
                          `${variacao.media_por_caixa || 20} kg`
                        )
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={variacao.ativo}
                        onCheckedChange={(checked) => {
                          updateProductMutation.mutate({
                            id: variacao.id,
                            updates: { ativo: checked }
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingProduct(editingProduct === variacao.id ? null : variacao.id)}
                      >
                        {editingProduct === variacao.id ? 'Finalizar' : 'Editar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProdutosTab;
