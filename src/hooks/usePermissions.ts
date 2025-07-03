
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
      console.log('🔍 [PERMISSIONS DEBUG] Iniciando carregamento de permissões...');
      console.log('🔍 [PERMISSIONS DEBUG] User ID:', user?.id);
      console.log('🔍 [PERMISSIONS DEBUG] User tipo:', user?.tipo);
      console.log('🔍 [PERMISSIONS DEBUG] User nome:', user?.nome);
      
      if (!user?.id) {
        console.log('🔍 [PERMISSIONS DEBUG] Sem user ID, limpando permissões');
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Master tem todas as permissões
      if (hasRole('master') || user.tipo === 'master') {
        console.log('🔍 [PERMISSIONS DEBUG] Usuário é MASTER, aplicando todas as permissões');
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
        console.log('🔍 [PERMISSIONS DEBUG] Buscando permissões específicas na tabela user_permissions...');
        
        // Buscar permissões específicas do usuário na tabela user_permissions
        const { data: userPermissions, error: permError } = await supabase
          .from('user_permissions')
          .select('resource, action, enabled')
          .eq('user_id', user.id);

        console.log('🔍 [PERMISSIONS DEBUG] Resultado da query user_permissions:', {
          data: userPermissions,
          error: permError,
          count: userPermissions?.length || 0
        });

        if (permError) {
          console.error('❌ [PERMISSIONS DEBUG] Erro ao carregar permissões:', permError);
        }

        // Se há permissões específicas, usar essas + permissões básicas
        if (userPermissions && userPermissions.length > 0) {
          console.log('🔍 [PERMISSIONS DEBUG] Encontradas permissões específicas, processando...');
          
          const specificPermissions: UserPermission[] = userPermissions.map(p => ({
            resource: p.resource as SystemResource,
            action: p.action as PermissionAction,
            enabled: p.enabled
          }));

          console.log('🔍 [PERMISSIONS DEBUG] Permissões específicas processadas:', specificPermissions);

          // Sempre incluir dashboard para todos
          const hasViewDashboard = specificPermissions.some(p => p.resource === 'dashboard' && p.action === 'view');
          if (!hasViewDashboard) {
            console.log('🔍 [PERMISSIONS DEBUG] Adicionando permissão de dashboard automaticamente');
            specificPermissions.push({ resource: 'dashboard', action: 'view', enabled: true });
          }

          console.log('🔍 [PERMISSIONS DEBUG] Permissões finais aplicadas:', specificPermissions);
          setPermissions(specificPermissions);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('❌ [PERMISSIONS DEBUG] Erro ao buscar permissões específicas:', error);
      }

      console.log('🔍 [PERMISSIONS DEBUG] Nenhuma permissão específica encontrada, usando permissões padrão baseadas no tipo');
      
      // Fallback: usar permissões padrão baseadas no tipo de usuário
      const defaultPermissions: UserPermission[] = [];
      
      // Permissões básicas para todos os usuários
      defaultPermissions.push(
        { resource: 'dashboard', action: 'view', enabled: true }
      );

      // Permissões específicas por tipo
      switch (user.tipo) {
        case 'comprador':
          console.log('🔍 [PERMISSIONS DEBUG] Aplicando permissões padrão para COMPRADOR');
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
          console.log('🔍 [PERMISSIONS DEBUG] Aplicando permissões padrão para ESTOQUE');
          defaultPermissions.push(
            { resource: 'estoque', action: 'view', enabled: true },
            { resource: 'estoque', action: 'edit', enabled: true },
            { resource: 'requisicoes', action: 'view', enabled: true },
            { resource: 'requisicoes', action: 'create', enabled: true }
          );
          break;
        
        case 'cd':
          console.log('🔍 [PERMISSIONS DEBUG] Aplicando permissões padrão para CD');
          defaultPermissions.push(
            { resource: 'gestao_cd', action: 'view', enabled: true },
            { resource: 'gestao_cd', action: 'edit', enabled: true },
            { resource: 'estoque', action: 'view', enabled: true }
          );
          break;
          
        default:
          console.log('🔍 [PERMISSIONS DEBUG] Tipo de usuário não reconhecido:', user.tipo);
      }

      console.log('🔍 [PERMISSIONS DEBUG] Permissões padrão finais aplicadas:', defaultPermissions);
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
          (payload) => {
            console.log('🔔 [PERMISSIONS DEBUG] Mudança detectada em permissões do usuário:', payload);
            console.log('🔔 [PERMISSIONS DEBUG] Recarregando permissões...');
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
