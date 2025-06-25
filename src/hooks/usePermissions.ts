
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface UserPermission {
  resource: SystemResource;
  action: PermissionAction;
  enabled: boolean;
}

export const usePermissions = () => {
  const { user, hasRole } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.id) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Master tem todas as permissões
      if (hasRole('master')) {
        const allPermissions: UserPermission[] = [
          { resource: 'dashboard', action: 'view', enabled: true },
          { resource: 'estoque', action: 'view', enabled: true },
          { resource: 'estoque', action: 'edit', enabled: true },
          { resource: 'requisicoes', action: 'view', enabled: true },
          { resource: 'requisicoes', action: 'create', enabled: true },
          { resource: 'requisicoes', action: 'edit', enabled: true },
          { resource: 'cotacao', action: 'view', enabled: true },
          { resource: 'cotacao', action: 'create', enabled: true },
          { resource: 'cotacao', action: 'edit', enabled: true },
          { resource: 'gestao_cd', action: 'view', enabled: true },
          { resource: 'gestao_cd', action: 'edit', enabled: true },
          { resource: 'configuracoes', action: 'view', enabled: true },
          { resource: 'configuracoes', action: 'edit', enabled: true },
          { resource: 'historico_requisicoes', action: 'view', enabled: true },
          { resource: 'historico_pedidos', action: 'view', enabled: true },
        ];
        setPermissions(allPermissions);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_user_permissions', { _user_id: user.id });

        if (error) {
          console.error('Erro ao carregar permissões:', error);
          setPermissions([]);
        } else {
          setPermissions(data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user?.id, hasRole]);

  const hasPermission = (resource: SystemResource, action: PermissionAction): boolean => {
    // Master sempre tem permissão
    if (hasRole('master')) return true;
    
    return permissions.some(p => 
      p.resource === resource && 
      p.action === action && 
      p.enabled
    );
  };

  const canView = (resource: SystemResource): boolean => {
    return hasPermission(resource, 'view');
  };

  const canEdit = (resource: SystemResource): boolean => {
    return hasPermission(resource, 'edit');
  };

  const canCreate = (resource: SystemResource): boolean => {
    return hasPermission(resource, 'create');
  };

  const canDelete = (resource: SystemResource): boolean => {
    return hasPermission(resource, 'delete');
  };

  return {
    permissions,
    loading,
    hasPermission,
    canView,
    canEdit,
    canCreate,
    canDelete
  };
};
