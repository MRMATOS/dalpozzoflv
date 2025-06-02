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
import { Loader2, Plus, Save } from 'lucide-react';
import { useLojas } from '@/hooks/useLojas';

const tiposUsuario = ['master', 'comprador', 'requisitante', 'estoque'];

const UsuariosTab = () => {
  const queryClient = useQueryClient();
  const { lojas } = useLojas();
  const [newUser, setNewUser] = useState({
    nome: '',
    codigo_acesso: '',
    tipo: 'requisitante',
    loja: ''
  });
  const [showNewUser, setShowNewUser] = useState(false);

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data;
    },
  });

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
      setNewUser({ nome: '', codigo_acesso: '', tipo: 'requisitante', loja: '' });
      setShowNewUser(false);
    },
    onError: (error) => {
      toast.error('Erro ao criar usuário: ' + error.message);
    },
  });

  const generateAccessCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewUser({ ...newUser, codigo_acesso: code });
  };

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
              <Input
                placeholder="Nome completo"
                value={newUser.nome}
                onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
              />
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
              <div className="flex space-x-2">
                <Button
                  onClick={() => createUserMutation.mutate(newUser)}
                  disabled={!newUser.nome.trim() || !newUser.codigo_acesso.trim() || !newUser.loja.trim() || createUserMutation.isPending}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios?.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell className="font-mono text-sm">{usuario.codigo_acesso}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {usuario.tipo.charAt(0).toUpperCase() + usuario.tipo.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{usuario.loja}</TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UsuariosTab;
