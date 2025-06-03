import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';

const unidades = ['Bandeja', 'Caixa', 'Kg', 'Maço', 'Pacote', 'Saco', 'Unidade'];

const ProdutosTab = () => {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    produto: '',
    unidade: 'Caixa',
    media_por_caixa: 20,
    ativo: true
  });
  const [showNewProduct, setShowNewProduct] = useState(false);

  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      console.log('Fazendo query para produtos...');
      
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('produto');
      
      console.log('Produtos carregados:', data);
      console.log('Erro na query:', error);
      
      if (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
      }
      
      return data;
    },
  });

  // Log para debug
  useEffect(() => {
    console.log('Estado da query:');
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('produtos:', produtos);
  }, [isLoading, error, produtos]);

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
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
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
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Produto criado com sucesso!');
      setNewProduct({ produto: '', unidade: 'Kg', media_por_caixa: 20, ativo: true });
      setShowNewProduct(false);
    },
    onError: (error) => {
      console.error('Erro ao criar produto:', error);
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });

  const mostrarMediaPorCaixa = (unidade: string) => {
    return unidade.toLowerCase() === 'caixa';
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
            onClick={() => queryClient.invalidateQueries({ queryKey: ['produtos'] })}
            className="mt-4"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!produtos || produtos.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Produtos</CardTitle>
          <Button onClick={() => setShowNewProduct(true)} disabled={showNewProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Nenhum produto cadastrado</p>
            {!showNewProduct && (
              <Button onClick={() => setShowNewProduct(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar primeiro produto
              </Button>
            )}
          </div>
          
          {showNewProduct && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">Novo Produto</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  placeholder="Nome do produto"
                  value={newProduct.produto}
                  onChange={(e) => setNewProduct({ ...newProduct, produto: e.target.value })}
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
                    onClick={() => createProductMutation.mutate(newProduct)}
                    disabled={!newProduct.produto.trim() || createProductMutation.isPending}
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
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Produtos ({produtos?.length || 0})</CardTitle>
        <Button onClick={() => setShowNewProduct(true)} disabled={showNewProduct}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </CardHeader>
      <CardContent>
        {showNewProduct && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Novo Produto</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Input
                placeholder="Nome do produto"
                value={newProduct.produto}
                onChange={(e) => setNewProduct({ ...newProduct, produto: e.target.value })}
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
                  onClick={() => createProductMutation.mutate(newProduct)}
                  disabled={!newProduct.produto.trim() || createProductMutation.isPending}
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
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Unidade Estoque</TableHead>
              <TableHead>Média por Caixa (kg)</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {produtos?.map((produto) => (
              <TableRow key={produto.id}>
                <TableCell>
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
                    produto.produto
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProdutosTab;
