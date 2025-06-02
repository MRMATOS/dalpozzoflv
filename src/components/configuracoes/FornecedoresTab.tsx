
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Edit, Trash2 } from 'lucide-react';

const FornecedoresTab = () => {
  const queryClient = useQueryClient();
  const [newFornecedor, setNewFornecedor] = useState({
    nome: '',
    telefone: ''
  });
  const [showNewFornecedor, setShowNewFornecedor] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<string | null>(null);

  const { data: fornecedores, isLoading } = useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

  const createFornecedorMutation = useMutation({
    mutationFn: async (fornecedor: any) => {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert([fornecedor])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor criado com sucesso!');
      setNewFornecedor({ nome: '', telefone: '' });
      setShowNewFornecedor(false);
    },
    onError: (error) => {
      toast.error('Erro ao criar fornecedor: ' + error.message);
    },
  });

  const updateFornecedorMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('fornecedores')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor atualizado com sucesso!');
      setEditingFornecedor(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar fornecedor: ' + error.message);
    },
  });

  const deleteFornecedorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir fornecedor: ' + error.message);
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
        <CardTitle>Fornecedores</CardTitle>
        <Button onClick={() => setShowNewFornecedor(true)} disabled={showNewFornecedor}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Fornecedor
        </Button>
      </CardHeader>
      <CardContent>
        {showNewFornecedor && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Novo Fornecedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Nome do fornecedor"
                value={newFornecedor.nome}
                onChange={(e) => setNewFornecedor({ ...newFornecedor, nome: e.target.value })}
              />
              <Input
                placeholder="Telefone (WhatsApp)"
                value={newFornecedor.telefone}
                onChange={(e) => setNewFornecedor({ ...newFornecedor, telefone: e.target.value })}
              />
              <div className="flex space-x-2">
                <Button
                  onClick={() => createFornecedorMutation.mutate(newFornecedor)}
                  disabled={!newFornecedor.nome.trim() || createFornecedorMutation.isPending}
                >
                  {createFornecedorMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setShowNewFornecedor(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fornecedores?.map((fornecedor) => (
              <TableRow key={fornecedor.id}>
                <TableCell>
                  {editingFornecedor === fornecedor.id ? (
                    <Input
                      defaultValue={fornecedor.nome}
                      onBlur={(e) => {
                        if (e.target.value !== fornecedor.nome) {
                          updateFornecedorMutation.mutate({
                            id: fornecedor.id,
                            updates: { nome: e.target.value }
                          });
                        }
                      }}
                    />
                  ) : (
                    fornecedor.nome
                  )}
                </TableCell>
                <TableCell>
                  {editingFornecedor === fornecedor.id ? (
                    <Input
                      defaultValue={fornecedor.telefone || ''}
                      onBlur={(e) => {
                        if (e.target.value !== fornecedor.telefone) {
                          updateFornecedorMutation.mutate({
                            id: fornecedor.id,
                            updates: { telefone: e.target.value }
                          });
                        }
                      }}
                    />
                  ) : (
                    fornecedor.telefone || '-'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingFornecedor(editingFornecedor === fornecedor.id ? null : fornecedor.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
                          deleteFornecedorMutation.mutate(fornecedor.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default FornecedoresTab;
