import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Save, Trash2, Edit } from 'lucide-react';
import { useLojas } from '@/hooks/useLojas';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const tiposUsuario = ['master', 'comprador', 'requisitante', 'estoque'];

const userSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  loja: z.string().min(1, "Loja é obrigatória"),
  codigo_acesso: z.string().min(3, "Código de acesso deve ter pelo menos 3 caracteres"),
  tipo: z.enum(['master', 'comprador', 'requisitante', 'estoque'])
});

const UsuariosTab = () => {
  const queryClient = useQueryClient();
  const { lojas } = useLojas();
  const { hasRole } = useAuth();
  const [newUser, setNewUser] = useState({
    nome: '',
    codigo_acesso: '',
    tipo: 'requisitante',
    loja: ''
  });
  const [showNewUser, setShowNewUser] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Verificar se o usuário atual é master
  const isMaster = hasRole('master');

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['profiles-with-roles'],
    queryFn: async () => {
      console.log('Buscando perfis de usuários...');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .order('nome');
      
      if (error) {
        console.error('Erro ao buscar perfis:', error);
        throw error;
      }
      
      // Format the data to include roles
      const formattedData = data?.map(profile => ({
        ...profile,
        tipo: (profile.user_roles as any)?.[0]?.role || 'requisitante'
      })) || [];
      
      console.log('Perfis encontrados:', formattedData);
      return formattedData;
    },
    enabled: isMaster,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      console.log('Criando usuário:', userData);
      
      // Validate input
      const result = userSchema.safeParse(userData);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        throw new Error('Dados inválidos');
      }
      
      setValidationErrors({});
      
      // Create user using anonymous auth and then update profile
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError) {
        throw new Error('Erro ao criar usuário: ' + authError.message);
      }

      if (!authData.user) {
        throw new Error('Erro ao criar usuário');
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          nome: userData.nome,
          loja: userData.loja,
          codigo_acesso: userData.codigo_acesso,
          ativo: true
        });

      if (profileError) {
        throw new Error('Erro ao criar perfil: ' + profileError.message);
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: userData.tipo
        });

      if (roleError) {
        throw new Error('Erro ao criar role: ' + roleError.message);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast.success('Usuário criado com sucesso!');
      setNewUser({ nome: '', codigo_acesso: '', tipo: 'requisitante', loja: '' });
      setShowNewUser(false);
    },
    onError: (error: any) => {
      console.error('Erro na mutation:', error);
      if (error.message !== 'Dados inválidos') {
        toast.error('Erro ao criar usuário: ' + error.message);
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (user: any) => {
      console.log('Atualizando perfil:', user);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome: user.nome,
          loja: user.loja,
          codigo_acesso: user.codigo_acesso,
          ativo: user.ativo
        })
        .eq('id', user.id);
      
      if (profileError) {
        console.error('Erro ao atualizar perfil:', profileError);
        throw profileError;
      }
      
      // Update role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: user.tipo })
        .eq('user_id', user.id);
      
      if (roleError) {
        console.error('Erro ao atualizar role:', roleError);
        throw roleError;
      }
      
      console.log('Perfil atualizado');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast.success('Usuário atualizado com sucesso!');
      setEditingUser(null);
    },
    onError: (error: any) => {
      console.error('Erro na mutation de update:', error);
      toast.error('Erro ao atualizar usuário: ' + error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Deletando usuário:', userId);
      
      // Delete from auth.users (this will cascade to profiles and user_roles)
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error('Erro ao deletar usuário:', error);
        throw error;
      }
      console.log('Usuário deletado');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles-with-roles'] });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro na mutation de delete:', error);
      toast.error('Erro ao remover usuário: ' + error.message);
    },
  });

  const generateAccessCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    if (editingUser) {
      setEditingUser({ ...editingUser, codigo_acesso: code });
    } else {
      setNewUser({ ...newUser, codigo_acesso: code });
    }
  };

  const handleEdit = (usuario: any) => {
    setEditingUser({ ...usuario });
  };

  const handleDelete = (userId: string) => {
    if (window.confirm('Tem certeza que deseja remover este usuário?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  if (!isMaster) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Apenas usuários master podem gerenciar usuários.</p>
        </CardContent>
      </Card>
    );
  }

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
        <CardTitle>Usuários</CardTitle>
        <Button onClick={() => setShowNewUser(true)} disabled={showNewUser}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </CardHeader>
      <CardContent>
        {showNewUser && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-semibold mb-4">Novo Usuário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Input
                  placeholder="Nome completo"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                />
                {validationErrors.nome && (
                  <p className="text-sm text-red-600 mt-1">{validationErrors.nome}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Código de acesso"
                  value={newUser.codigo_acesso}
                  onChange={(e) => setNewUser({ ...newUser, codigo_acesso: e.target.value })}
                />
                <Button variant="outline" onClick={generateAccessCode}>
                  Gerar
                </Button>
              </div>
              {validationErrors.codigo_acesso && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.codigo_acesso}</p>
              )}
              <Select value={newUser.tipo} onValueChange={(value) => setNewUser({ ...newUser, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposUsuario.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newUser.loja} onValueChange={(value) => setNewUser({ ...newUser, loja: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.nome}>
                      {loja.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.loja && (
                <p className="text-sm text-red-600 mt-1">{validationErrors.loja}</p>
              )}
              <div className="flex space-x-2">
                <Button
                  onClick={() => createUserMutation.mutate(newUser)}
                  disabled={createUserMutation.isPending}
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Código de Acesso</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Login</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios?.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">
                  {editingUser?.id === usuario.id ? (
                    <Input
                      value={editingUser.nome}
                      onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                    />
                  ) : (
                    usuario.nome
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {editingUser?.id === usuario.id ? (
                    <div className="flex space-x-2">
                      <Input
                        value={editingUser.codigo_acesso}
                        onChange={(e) => setEditingUser({ ...editingUser, codigo_acesso: e.target.value })}
                      />
                      <Button variant="outline" size="sm" onClick={generateAccessCode}>
                        Gerar
                      </Button>
                    </div>
                  ) : (
                    usuario.codigo_acesso
                  )}
                </TableCell>
                <TableCell>
                  {editingUser?.id === usuario.id ? (
                    <Select value={editingUser.tipo} onValueChange={(value) => setEditingUser({ ...editingUser, tipo: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposUsuario.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">
                      {usuario.tipo.charAt(0).toUpperCase() + usuario.tipo.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {editingUser?.id === usuario.id ? (
                    <Select value={editingUser.loja} onValueChange={(value) => setEditingUser({ ...editingUser, loja: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {lojas.map((loja) => (
                          <SelectItem key={loja.id} value={loja.nome}>
                            {loja.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    usuario.loja
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={usuario.ativo ? "default" : "secondary"}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {usuario.ultimo_login 
                    ? new Date(usuario.ultimo_login).toLocaleDateString('pt-BR') 
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {editingUser?.id === usuario.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateUserMutation.mutate(editingUser)}
                          disabled={updateUserMutation.isPending}
                        >
                          {updateUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingUser(null)}
                        >
                          Cancelar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(usuario)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(usuario.id)}
                          disabled={deleteUserMutation.isPending}
                        >
                          {deleteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </>
                    )}
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

export default UsuariosTab;
