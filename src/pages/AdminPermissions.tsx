
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Shield, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserWithPermissions {
  id: string;
  nome: string;
  tipo: string;
  loja: string;
  aprovado: boolean;
  permissions: Array<{
    resource: string;
    action: string;
    enabled: boolean;
    is_default: boolean; // Indica se é uma permissão padrão
  }>;
}

type SystemResource = 
  | 'dashboard'
  | 'estoque' 
  | 'requisicoes'
  | 'cotacao'
  | 'gestao_cd'
  | 'configuracoes'
  | 'historico_requisicoes'
  | 'historico_pedidos';

type PermissionAction = 'view' | 'edit' | 'create' | 'delete';

// Definir permissões padrão por tipo
const getDefaultPermissionsByType = (userType: string) => {
  const defaults = {
    cd: [
      { resource: 'dashboard', action: 'view' },
      { resource: 'gestao_cd', action: 'view' },
      { resource: 'gestao_cd', action: 'create' },
      { resource: 'gestao_cd', action: 'edit' },
      { resource: 'gestao_cd', action: 'delete' },
      { resource: 'estoque', action: 'view' },
      { resource: 'estoque', action: 'create' },
      { resource: 'estoque', action: 'edit' },
      { resource: 'estoque', action: 'delete' },
    ],
    comprador: [
      { resource: 'dashboard', action: 'view' },
      { resource: 'cotacao', action: 'view' },
      { resource: 'cotacao', action: 'create' },
      { resource: 'cotacao', action: 'edit' },
      { resource: 'cotacao', action: 'delete' },
      { resource: 'requisicoes', action: 'view' },
      { resource: 'requisicoes', action: 'create' },
      { resource: 'requisicoes', action: 'edit' },
      { resource: 'requisicoes', action: 'delete' },
      { resource: 'estoque', action: 'view' },
      { resource: 'estoque', action: 'create' },
      { resource: 'estoque', action: 'edit' },
      { resource: 'estoque', action: 'delete' },
      { resource: 'historico_pedidos', action: 'view' },
      { resource: 'historico_requisicoes', action: 'view' },
    ],
    estoque: [
      { resource: 'dashboard', action: 'view' },
      { resource: 'requisicoes', action: 'view' },
      { resource: 'requisicoes', action: 'create' },
      { resource: 'requisicoes', action: 'edit' },
      { resource: 'requisicoes', action: 'delete' },
      { resource: 'estoque', action: 'view' },
      { resource: 'estoque', action: 'create' },
      { resource: 'estoque', action: 'edit' },
      { resource: 'estoque', action: 'delete' },
    ]
  };

  return defaults[userType as keyof typeof defaults] || [{ resource: 'dashboard', action: 'view' }];
};

const AdminPermissions = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar se é master
  if (!hasRole('master')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-8 text-center">
            <Shield className="w-16 h-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">Apenas usuários master podem acessar esta página.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('🔍 Carregando usuários e permissões...');

      // Buscar usuários aprovados
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome, tipo, loja, aprovado')
        .eq('aprovado', true)
        .neq('tipo', 'master')
        .order('nome');

      if (usuariosError) {
        console.error('Erro ao carregar usuários:', usuariosError);
        toast.error('Erro ao carregar usuários');
        return;
      }

      console.log('✅ Usuários carregados:', usuariosData);

      // Para cada usuário, carregar suas permissões e combinar com padrões
      const usersWithPermissions = await Promise.all(
        usuariosData.map(async (usuario) => {
          // Buscar permissões específicas do usuário
          const { data: userPerms, error: permsError } = await supabase
            .from('user_permissions')
            .select('resource, action, enabled')
            .eq('user_id', usuario.id);

          if (permsError) {
            console.error(`Erro ao carregar permissões do usuário ${usuario.nome}:`, permsError);
          }

          // Obter permissões padrão para o tipo do usuário
          const defaultPermissions = getDefaultPermissionsByType(usuario.tipo);
          
          // Combinar permissões padrão com específicas
          const allPermissions = defaultPermissions.map(defaultPerm => {
            const specificPerm = userPerms?.find(
              p => p.resource === defaultPerm.resource && p.action === defaultPerm.action
            );

            return {
              resource: defaultPerm.resource,
              action: defaultPerm.action,
              enabled: specificPerm ? specificPerm.enabled : true, // Padrão é habilitado
              is_default: !specificPerm // É padrão se não tem configuração específica
            };
          });

          // Adicionar permissões específicas que não são padrão
          const customPermissions = userPerms?.filter(perm => 
            !defaultPermissions.some(def => 
              def.resource === perm.resource && def.action === perm.action
            )
          ) || [];

          customPermissions.forEach(customPerm => {
            allPermissions.push({
              resource: customPerm.resource,
              action: customPerm.action,
              enabled: customPerm.enabled,
              is_default: false
            });
          });

          return {
            ...usuario,
            permissions: allPermissions
          };
        })
      );

      console.log('✅ Usuários com permissões carregados:', usersWithPermissions);
      setUsers(usersWithPermissions);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      setLoading(false);
    }
  };

  const togglePermission = async (
    userId: string, 
    resource: SystemResource, 
    action: PermissionAction, 
    currentEnabled: boolean
  ) => {
    try {
      console.log(`🔄 Alterando permissão: ${resource}.${action} para usuário ${userId}`);

      const { error } = await supabase
        .from('user_permissions')
        .upsert({
          user_id: userId,
          resource,
          action,
          enabled: !currentEnabled
        }, {
          onConflict: 'user_id,resource,action'
        });

      if (error) {
        console.error('Erro ao atualizar permissão:', error);
        toast.error('Erro ao atualizar permissão');
        return;
      }

      console.log('✅ Permissão atualizada com sucesso');
      toast.success('Permissão atualizada com sucesso');

      // Recarregar dados
      loadUsers();
    } catch (error) {
      console.error('Erro ao alterar permissão:', error);
      toast.error('Erro ao alterar permissão');
    }
  };

  const getResourceLabel = (resource: string) => {
    const labels = {
      dashboard: 'Dashboard',
      estoque: 'Estoque',
      requisicoes: 'Requisições',
      cotacao: 'Cotação',
      gestao_cd: 'Gestão CD',
      configuracoes: 'Configurações',
      historico_requisicoes: 'Histórico Requisições',
      historico_pedidos: 'Histórico Pedidos'
    };
    return labels[resource as keyof typeof labels] || resource;
  };

  const getActionLabel = (action: string) => {
    const labels = {
      view: 'Visualizar',
      edit: 'Editar',
      create: 'Criar',
      delete: 'Excluir'
    };
    return labels[action as keyof typeof labels] || action;
  };

  const getTipoColor = (tipo: string) => {
    const colors = {
      master: 'bg-red-100 text-red-800',
      comprador: 'bg-blue-100 text-blue-800',
      estoque: 'bg-green-100 text-green-800',
      cd: 'bg-purple-100 text-purple-800'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/configuracoes')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900">Administração de Permissões</h1>
              <p className="text-sm text-gray-500">Gerencie permissões de usuários do sistema</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {users.map((user) => (
            <Card key={user.id} className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <CardTitle className="text-lg">{user.nome}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getTipoColor(user.tipo)}>
                          {user.tipo.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-500">• {user.loja}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 mb-3">Permissões:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from(new Set(user.permissions.map(p => p.resource))).map(resource => (
                      <div key={resource} className="border rounded-lg p-4 space-y-3">
                        <h5 className="font-medium text-sm text-gray-900 border-b pb-2">
                          {getResourceLabel(resource)}
                        </h5>
                        <div className="space-y-2">
                          {user.permissions
                            .filter(p => p.resource === resource)
                            .map(permission => (
                              <div key={`${resource}-${permission.action}`} className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">
                                    {getActionLabel(permission.action)}
                                  </span>
                                  {permission.is_default && (
                                    <Badge variant="secondary" className="text-xs">
                                      Padrão
                                    </Badge>
                                  )}
                                </div>
                                <Switch
                                  checked={permission.enabled}
                                  onCheckedChange={() => togglePermission(
                                    user.id,
                                    resource as SystemResource,
                                    permission.action as PermissionAction,
                                    permission.enabled
                                  )}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {users.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-600">Não há usuários aprovados para gerenciar permissões.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPermissions;
