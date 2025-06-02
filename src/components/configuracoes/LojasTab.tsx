
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Edit, Trash2 } from 'lucide-react';

const LojasTab = () => {
  const queryClient = useQueryClient();
  const [newLoja, setNewLoja] = useState({
    nome: '',
    ativo: true
  });
  const [showNewLoja, setShowNewLoja] = useState(false);
  const [editingLoja, setEditingLoja] = useState<string | null>(null);

  const { data: lojas, isLoading } = useQuery({
    queryKey: ['lojas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojas')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

  const createLojaMutation = useMutation({
    mutationFn: async (loja: any) => {
      const { data, error } = await supabase
        .from('lojas')
        .insert([loja])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lojas'] });
      toast.success('Loja criada com sucesso!');
      setNewLoja({ nome: '', ativo: true });
      setShowNewLoja(false);
    },
    onError: (error) => {
      toast.error('Erro ao criar loja: ' + error.message);
    },
  });

  const updateLojaMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('lojas')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lojas'] });
      toast.success('Loja atualizada com sucesso!');
      setEditingLoja(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar loja: ' + error.message);
    },
  });

  const deleteLojaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lojas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lojas'] });
      toast.success('Loja excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir loja: ' + error.message);
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
        <CardTitle>Lojas</CardTitle>
        <Button onClick={() => setShowNewLoja(true)} disabled={showNewLoja}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Loja
        </Button>
      </CardHeader>
      <CardContent>
        {showNewLoja && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Nova Loja</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Nome da loja"
                value={newLoja.nome}
                onChange={(e) => setNewLoja({ ...newLoja, nome: e.target.value })}
              />
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newLoja.ativo}
                  onCheckedChange={(checked) => setNewLoja({ ...newLoja, ativo: checked })}
                />
                <span className="text-sm">Ativa</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => createLojaMutation.mutate(newLoja)}
                  disabled={!newLoja.nome.trim() || createLojaMutation.isPending}
                >
                  {createLojaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setShowNewLoja(false)}>
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
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lojas?.map((loja) => (
              <TableRow key={loja.id}>
                <TableCell>
                  {editingLoja === loja.id ? (
                    <Input
                      defaultValue={loja.nome}
                      onBlur={(e) => {
                        if (e.target.value !== loja.nome) {
                          updateLojaMutation.mutate({
                            id: loja.id,
                            updates: { nome: e.target.value }
                          });
                        }
                      }}
                    />
                  ) : (
                    loja.nome
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={loja.ativo}
                      onCheckedChange={(checked) => {
                        updateLojaMutation.mutate({
                          id: loja.id,
                          updates: { ativo: checked }
                        });
                      }}
                    />
                    <Badge variant={loja.ativo ? "default" : "secondary"}>
                      {loja.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {loja.criado_em 
                    ? new Date(loja.criado_em).toLocaleDateString('pt-BR') 
                    : '-'
                  }
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingLoja(editingLoja === loja.id ? null : loja.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta loja?')) {
                          deleteLojaMutation.mutate(loja.id);
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

export default LojasTab;
