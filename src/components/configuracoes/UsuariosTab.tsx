
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Save } from 'lucide-react';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import UsuarioCard from './UsuarioCard';
import { useLojas } from '@/hooks/useLojas';

const UsuariosTab = () => {
  const queryClient = useQueryClient();
  const { lojas, cdLoja } = useLojas();
  const [newUser, setNewUser] = useState({
    nome: '',
    tipo: 'estoque',
    loja: 'Home',
    codigo_acesso: '',
    ativo: true
  });
  const [showNewUser, setShowNewUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    usuario: any;
    title: string;
    description: string;
  }>({
    open: false,
    usuario: null,
    title: '',
    description: ''
  });

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('criado_em', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Contar novos usuários (sem aprovação)
  const novosUsuarios = usuarios?.filter(u => !u.aprovado).length || 0;

  const createUserMutation = useMutation({
    mutationFn: async (user: any) => {
      const { data, error } = await supabase
        .from('usuarios')
        .insert([user])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário criado com sucesso!');
      setNewUser({ nome: '', tipo: 'estoque', loja: 'Home', codigo_acesso: '', ativo: true });
      setShowNewUser(false);
    },
    onError: (error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso!');
      setEditingUser(null);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar usuário: ' + error.message);
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('aprovar_usuario', { user_uuid: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário aprovado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao aprovar usuário: ' + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário excluído com sucesso!');
      setDeleteDialog({ open: false, usuario: null, title: '', description: '' });
    },
    onError: (error) => {
      toast.error('Erro ao excluir usuário: ' + error.message);
      setDeleteDialog({ open: false, usuario: null, title: '', description: '' });
    },
  });

  const handleDeleteClick = (usuario: any) => {
    setDeleteDialog({
      open: true,
      usuario,
      title: 'Confirmar exclusão',
      description: `Tem certeza que deseja excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`
    });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.usuario) {
      deleteUserMutation.mutate(deleteDialog.usuario.id);
    }
  };

  // Função para determinar lojas disponíveis baseado no tipo
  const getAvailableLojas = (tipo: string) => {
    if (tipo === 'cd') {
      return cdLoja ? [cdLoja] : [];
    }
    return lojas.filter(loja => !loja.is_cd);
  };

  // Auto-selecionar loja baseado no tipo
  const handleNewUserTipoChange = (tipo: string) => {
    const updates = { ...newUser, tipo };
    
    if (tipo === 'cd' && cdLoja) {
      updates.loja = cdLoja.nome;
    } else if (tipo !== 'cd' && newUser.loja === cdLoja?.nome) {
      const availableLojas = lojas.filter(loja => !loja.is_cd);
      updates.loja = availableLojas[0]?.nome || 'Home';
    }
    
    setNewUser(updates);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const availableLojas = getAvailableLojas(newUser.tipo);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base md:text-lg">Usuários</CardTitle>
            {novosUsuarios > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 animate-pulse">
                {novosUsuarios} aguardando aprovação
              </span>
            )}
          </div>
          <Button onClick={() => setShowNewUser(true)} disabled={showNewUser} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo
          </Button>
        </CardHeader>
        <CardContent>
          {showNewUser && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-4">Novo Usuário</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Input
                  placeholder="Nome completo"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                />
                <Select value={newUser.tipo} onValueChange={handleNewUserTipoChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comprador">Comprador</SelectItem>
                    <SelectItem value="estoque">Estoque</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="cd">Centro de Distribuição</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={newUser.loja} 
                  onValueChange={(value) => setNewUser({ ...newUser, loja: value })}
                  disabled={newUser.tipo === 'cd' && availableLojas.length <= 1}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLojas.map(loja => (
                      <SelectItem key={loja.id} value={loja.nome}>
                        {loja.nome} {loja.is_cd ? '(CD)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Código de acesso"
                  value={newUser.codigo_acesso}
                  onChange={(e) => setNewUser({ ...newUser, codigo_acesso: e.target.value })}
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newUser.ativo}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, ativo: checked })}
                  />
                  <span className="text-sm">Ativo</span>
                </div>
                <div className="flex space-x-2 md:col-span-5">
                  <Button
                    onClick={() => createUserMutation.mutate(newUser)}
                    disabled={!newUser.nome.trim() || !newUser.codigo_acesso.trim() || createUserMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewUser(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {usuarios?.map((usuario) => (
              <UsuarioCard
                key={usuario.id}
                usuario={usuario}
                onEdit={(usuario) => setEditingUser(usuario.id)}
                onDelete={handleDeleteClick}
                onUpdate={(id, updates) => updateUserMutation.mutate({ id, updates })}
                onApprove={(id) => approveUserMutation.mutate(id)}
                editingUser={editingUser}
                setEditingUser={setEditingUser}
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
        isLoading={deleteUserMutation.isPending}
      />
    </>
  );
};

export default UsuariosTab;
