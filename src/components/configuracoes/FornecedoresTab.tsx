
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import FornecedorDeletionHandler from './FornecedorDeletionHandler';
import FornecedorCard from './FornecedorCard';

const FornecedoresTab = () => {
  const queryClient = useQueryClient();
  const [newFornecedor, setNewFornecedor] = useState({
    nome: '',
    telefone: ''
  });
  const [showNewFornecedor, setShowNewFornecedor] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<string | null>(null);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<any>(null);

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

  const handleDeleteClick = (fornecedor: any) => {
    setFornecedorToDelete(fornecedor);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base md:text-lg">Fornecedores</CardTitle>
          <Button onClick={() => setShowNewFornecedor(true)} disabled={showNewFornecedor} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          {showNewFornecedor && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50">
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
                    className="bg-green-600 hover:bg-green-700"
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

          <div className="space-y-3">
            {fornecedores?.map((fornecedor) => (
              <FornecedorCard
                key={fornecedor.id}
                fornecedor={fornecedor}
                onEdit={(fornecedor) => setEditingFornecedor(fornecedor.id)}
                onDelete={handleDeleteClick}
                onUpdate={(id, updates) => updateFornecedorMutation.mutate({ id, updates })}
                editingFornecedor={editingFornecedor}
                setEditingFornecedor={setEditingFornecedor}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {fornecedorToDelete && (
        <DeleteConfirmDialog
          open={!!fornecedorToDelete}
          onOpenChange={(open) => !open && setFornecedorToDelete(null)}
          onConfirm={() => {}}
          title="Excluir Fornecedor"
          description=""
          customContent={
            <FornecedorDeletionHandler
              fornecedorId={fornecedorToDelete.id}
              fornecedorNome={fornecedorToDelete.nome}
              onDeleteSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
                setFornecedorToDelete(null);
              }}
              onCancel={() => setFornecedorToDelete(null)}
            />
          }
        />
      )}
    </>
  );
};

export default FornecedoresTab;
