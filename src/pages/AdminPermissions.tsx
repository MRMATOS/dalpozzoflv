
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Users, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Usuario {
  id: string;
  nome: string;
  loja: string;
  tipo: string;
  ativo: boolean;
}

interface Permission {
  resource: string;
  action: string;
  enabled: boolean;
}

const RESOURCES = [
  { key: 'dashboard', label: '📊 Dashboard', actions: ['view'] },
  { key: 'estoque', label: '📦 Estoque', actions: ['view', 'edit'] },
  { key: 'requisicoes', label: '🛒 Requisições', actions: ['view', 'create', 'edit'] },
  { key: 'cotacao', label: '💰 Cotação', actions: ['view', 'create', 'edit'] },
  { key: 'gestao_cd', label: '🚚 Gestão CD', actions: ['view', 'edit'] },
  { key: 'configuracoes', label: '⚙️ Configurações', actions: ['view', 'edit'] },
  { key: 'historico_requisicoes', label: '📋 Histórico Requisições', actions: ['view'] },
  { key: 'historico_pedidos', label: '📈 Histórico Pedidos', actions: ['view'] }
];

const ACTION_LABELS = {
  view: 'Ver',
  edit: 'Editar',
  create: 'Criar',
  delete: 'Excluir'
};

const AdminPermissions = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Verificar se é master
  if (!hasRole('master')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">Apenas usuários master podem acessar esta página.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários (exceto master)
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nome, loja, tipo, ativo')
        .neq('tipo', 'master')
        .eq('ativo', true)
        .order('nome');

      if (usuariosError) throw usuariosError;

      // Carregar permissões de todos os usuários
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('user_id, resource, action, enabled');

      if (permissionsError) throw permissionsError;

      setUsuarios(usuariosData || []);

      // Organizar permissões por usuário
      const permissionsByUser: Record<string, Permission[]> = {};
      (usuariosData || []).forEach(user => {
        const userPermissions = permissionsData?.filter(p => p.user_id === user.id) || [];
        permissionsByUser[user.id] = userPermissions;
      });

      setPermissions(permissionsByUser);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const hasUserPermission = (userId: string, resource: string, action: string): boolean => {
    const userPermissions = permissions[userId] || [];
    const permission = userPermissions.find(p => p.resource === resource && p.action === action);
    return permission?.enabled || false;
  };

  const togglePermission = async (userId: string, resource: string, action: string, enabled: boolean) => {
    try {
      setSaving(true);

      // Verificar se a permissão já existe
      const { data: existing } = await supabase
        .from('user_permissions')
        .select('id')
        .eq('user_id', userId)
        .eq('resource', resource as any)
        .eq('action', action as any)
        .maybeSingle();

      if (existing) {
        // Update existing permission
        const { error: updateError } = await supabase
          .from('user_permissions')
          .update({ enabled })
          .eq('user_id', userId)
          .eq('resource', resource as any)
          .eq('action', action as any);

        if (updateError) throw updateError;
      } else {
        // Insert new permission
        const { error: insertError } = await supabase
          .from('user_permissions')
          .insert({
            user_id: userId,
            resource: resource as any,
            action: action as any,
            enabled: enabled
          });

        if (insertError) throw insertError;
      }

      // Atualizar estado local
      setPermissions(prev => ({
        ...prev,
        [userId]: [
          ...(prev[userId] || []).filter(p => !(p.resource === resource && p.action === action)),
          { resource, action, enabled }
        ]
      }));

      toast.success('Permissão atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast.error('Erro ao atualizar permissão');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </Button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Administração de Permissões
              </h1>
              <p className="text-sm text-gray-500">Controle granular de acesso por usuário</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {usuarios.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum usuário encontrado para gerenciar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {usuarios.map((usuario) => (
              <Card key={usuario.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>
                      <span className="text-lg">{usuario.nome}</span>
                      <div className="text-sm text-gray-500 mt-1">
                        {usuario.loja} • {usuario.tipo}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {RESOURCES.map((resource) => (
                      <div key={resource.key} className="space-y-3">
                        <h4 className="font-medium text-gray-900">{resource.label}</h4>
                        <div className="space-y-2">
                          {resource.actions.map((action) => (
                            <div key={action} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                {ACTION_LABELS[action as keyof typeof ACTION_LABELS]}
                              </span>
                              <Switch
                                checked={hasUserPermission(usuario.id, resource.key, action)}
                                onCheckedChange={(checked) => 
                                  togglePermission(usuario.id, resource.key, action, checked)
                                }
                                disabled={saving}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPermissions;
