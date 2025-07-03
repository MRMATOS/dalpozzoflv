
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
      if (hasRole('master') || user.tipo === 'master') {
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
        // Buscar permissões específicas do usuário na tabela user_permissions
        const { data: userPermissions, error: permError } = await supabase
          .from('user_permissions')
          .select('resource, action, enabled')
          .eq('user_id', user.id);

        if (permError) {
          console.error('Erro ao carregar permissões:', permError);
        }

        // Se há permissões específicas, usar essas + permissões básicas
        if (userPermissions && userPermissions.length > 0) {
          const specificPermissions: UserPermission[] = userPermissions.map(p => ({
            resource: p.resource as SystemResource,
            action: p.action as PermissionAction,
            enabled: p.enabled
          }));

          // Sempre incluir dashboard para todos
          const hasViewDashboard = specificPermissions.some(p => p.resource === 'dashboard' && p.action === 'view');
          if (!hasViewDashboard) {
            specificPermissions.push({ resource: 'dashboard', action: 'view', enabled: true });
          }

          setPermissions(specificPermissions);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao buscar permissões específicas:', error);
      }

      // Fallback: usar permissões padrão baseadas no tipo de usuário
      const defaultPermissions: UserPermission[] = [];
      
      // Permissões básicas para todos os usuários
      defaultPermissions.push(
        { resource: 'dashboard', action: 'view', enabled: true }
      );

      // Permissões específicas por tipo
      switch (user.tipo) {
        case 'comprador':
          defaultPermissions.push(
            { resource: 'estoque', action: 'view', enabled: true },
            { resource: 'requisicoes', action: 'view', enabled: true },
            { resource: 'cotacao', action: 'view', enabled: true },
            { resource: 'cotacao', action: 'create', enabled: true },
            { resource: 'cotacao', action: 'edit', enabled: true },
            { resource: 'historico_requisicoes', action: 'view', enabled: true },
            { resource: 'historico_pedidos', action: 'view', enabled: true }
          );
          break;
        
        case 'estoque':
          defaultPermissions.push(
            { resource: 'estoque', action: 'view', enabled: true },
            { resource: 'estoque', action: 'edit', enabled: true },
            { resource: 'requisicoes', action: 'view', enabled: true },
            { resource: 'requisicoes', action: 'create', enabled: true }
          );
          break;
        
        case 'cd':
          defaultPermissions.push(
            { resource: 'gestao_cd', action: 'view', enabled: true },
            { resource: 'gestao_cd', action: 'edit', enabled: true },
            { resource: 'estoque', action: 'view', enabled: true }
          );
          break;
      }

      setPermissions(defaultPermissions);
      setLoading(false);
    };

    loadPermissions();

    // Configurar listener para mudanças em permissões
    if (user?.id) {
      const channel = supabase
        .channel('user-permissions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_permissions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Mudança detectada em permissões do usuário, recarregando...');
            loadPermissions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, user?.tipo, hasRole]);

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
