
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
    unidade: 'Kg',
    ativo: true
  });
  const [showNewProduct, setShowNewProduct] = useState(false);

  const { data: produtos, isLoading } = useQuery({
    queryKey: ['produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          escala_abastecimento (
            escala1,
            escala2,
            escala3
          )
        `)
        .order('produto');
      
      if (error) throw error;
      return data;
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
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
      toast.error('Erro ao atualizar produto: ' + error.message);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (produto: any) => {
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
      setNewProduct({ produto: '', unidade: 'Kg', ativo: true });
      setShowNewProduct(false);
    },
    onError: (error) => {
      toast.error('Erro ao criar produto: ' + error.message);
    },
  });

  const updateEscalaMutation = useMutation({
    mutationFn: async ({ produtoId, escala }: { produtoId: string; escala: any }) => {
      const { data: existing } = await supabase
        .from('escala_abastecimento')
        .select('id')
        .eq('produto_id', produtoId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('escala_abastecimento')
          .update(escala)
          .eq('produto_id', produtoId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('escala_abastecimento')
          .insert([{ produto_id: produtoId, ...escala }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      toast.success('Escala atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar escala: ' + error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
        {showNewProduct && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Novo Produto</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Nome do produto"
                value={newProduct.produto}
                onChange={(e) => setNewProduct({ ...newProduct, produto: e.target.value })}
              />
              <Select value={newProduct.unidade} onValueChange={(value) => setNewProduct({ ...newProduct, unidade: value })}>
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
              <TableHead>Unidade</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Escala 1</TableHead>
              <TableHead>Escala 2</TableHead>
              <TableHead>Escala 3</TableHead>
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
                          updates: { unidade: value }
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
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-20"
                    defaultValue={produto.escala_abastecimento?.[0]?.escala1 || ''}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value) || null;
                      updateEscalaMutation.mutate({
                        produtoId: produto.id,
                        escala: {
                          escala1: value,
                          escala2: produto.escala_abastecimento?.[0]?.escala2 || null,
                          escala3: produto.escala_abastecimento?.[0]?.escala3 || null,
                        }
                      });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-20"
                    defaultValue={produto.escala_abastecimento?.[0]?.escala2 || ''}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value) || null;
                      updateEscalaMutation.mutate({
                        produtoId: produto.id,
                        escala: {
                          escala1: produto.escala_abastecimento?.[0]?.escala1 || null,
                          escala2: value,
                          escala3: produto.escala_abastecimento?.[0]?.escala3 || null,
                        }
                      });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    placeholder="0"
                    className="w-20"
                    defaultValue={produto.escala_abastecimento?.[0]?.escala3 || ''}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value) || null;
                      updateEscalaMutation.mutate({
                        produtoId: produto.id,
                        escala: {
                          escala1: produto.escala_abastecimento?.[0]?.escala1 || null,
                          escala2: produto.escala_abastecimento?.[0]?.escala2 || null,
                          escala3: value,
                        }
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
