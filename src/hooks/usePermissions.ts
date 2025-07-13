
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SystemResource = 
  | 'dashboard'
  | 'estoque' 
  | 'requisicoes'
  | 'cotacao'
  | 'pedido_simples'
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

// Definir permissões padrão por tipo de usuário
const getDefaultPermissionsByType = (userType: string): UserPermission[] => {
  const basePermissions: UserPermission[] = [
    { resource: 'dashboard', action: 'view', enabled: true }
  ];

  switch (userType) {
    case 'master':
      // Master tem todas as permissões (gerenciado pela função is_user_master)
      return [
        ...basePermissions,
        { resource: 'estoque', action: 'view', enabled: true },
        { resource: 'estoque', action: 'edit', enabled: true },
        { resource: 'estoque', action: 'create', enabled: true },
        { resource: 'estoque', action: 'delete', enabled: true },
        { resource: 'requisicoes', action: 'view', enabled: true },
        { resource: 'requisicoes', action: 'create', enabled: true },
        { resource: 'requisicoes', action: 'edit', enabled: true },
        { resource: 'requisicoes', action: 'delete', enabled: true },
        { resource: 'cotacao', action: 'view', enabled: true },
        { resource: 'cotacao', action: 'create', enabled: true },
        { resource: 'cotacao', action: 'edit', enabled: true },
        { resource: 'cotacao', action: 'delete', enabled: true },
        { resource: 'pedido_simples', action: 'view', enabled: true },
        { resource: 'pedido_simples', action: 'create', enabled: true },
        { resource: 'pedido_simples', action: 'edit', enabled: true },
        { resource: 'pedido_simples', action: 'delete', enabled: true },
        { resource: 'gestao_cd', action: 'view', enabled: true },
        { resource: 'gestao_cd', action: 'edit', enabled: true },
        { resource: 'gestao_cd', action: 'create', enabled: true },
        { resource: 'gestao_cd', action: 'delete', enabled: true },
        { resource: 'configuracoes', action: 'view', enabled: true },
        { resource: 'configuracoes', action: 'edit', enabled: true },
        { resource: 'historico_requisicoes', action: 'view', enabled: true },
        { resource: 'historico_pedidos', action: 'view', enabled: true },
      ];

    case 'cd':
      // CD: Gestão CD, Recebimento, Estoque (C/R/U/D completo)
      return [
        ...basePermissions,
        { resource: 'gestao_cd', action: 'view', enabled: true },
        { resource: 'gestao_cd', action: 'create', enabled: true },
        { resource: 'gestao_cd', action: 'edit', enabled: true },
        { resource: 'gestao_cd', action: 'delete', enabled: true },
        { resource: 'estoque', action: 'view', enabled: true },
        { resource: 'estoque', action: 'create', enabled: true },
        { resource: 'estoque', action: 'edit', enabled: true },
        { resource: 'estoque', action: 'delete', enabled: true },
      ];
    
    case 'comprador':
      // Comprador: Cotação, Requisições, Estoque, Históricos (C/R/U/D completo)
      return [
        ...basePermissions,
        { resource: 'cotacao', action: 'view', enabled: true },
        { resource: 'cotacao', action: 'create', enabled: true },
        { resource: 'cotacao', action: 'edit', enabled: true },
        { resource: 'cotacao', action: 'delete', enabled: true },
        { resource: 'pedido_simples', action: 'view', enabled: true },
        { resource: 'pedido_simples', action: 'create', enabled: true },
        { resource: 'pedido_simples', action: 'edit', enabled: true },
        { resource: 'pedido_simples', action: 'delete', enabled: true },
        { resource: 'requisicoes', action: 'view', enabled: true },
        { resource: 'requisicoes', action: 'create', enabled: true },
        { resource: 'requisicoes', action: 'edit', enabled: true },
        { resource: 'requisicoes', action: 'delete', enabled: true },
        { resource: 'estoque', action: 'view', enabled: true },
        { resource: 'estoque', action: 'create', enabled: true },
        { resource: 'estoque', action: 'edit', enabled: true },
        { resource: 'estoque', action: 'delete', enabled: true },
        { resource: 'historico_pedidos', action: 'view', enabled: true },
        { resource: 'historico_requisicoes', action: 'view', enabled: true },
      ];
    
    case 'estoque':
      // Estoque: Requisições e Estoque (C/R/U/D completo)
      return [
        ...basePermissions,
        { resource: 'requisicoes', action: 'view', enabled: true },
        { resource: 'requisicoes', action: 'create', enabled: true },
        { resource: 'requisicoes', action: 'edit', enabled: true },
        { resource: 'requisicoes', action: 'delete', enabled: true },
        { resource: 'estoque', action: 'view', enabled: true },
        { resource: 'estoque', action: 'create', enabled: true },
        { resource: 'estoque', action: 'edit', enabled: true },
        { resource: 'estoque', action: 'delete', enabled: true },
      ];
      
    default:
      return basePermissions;
  }
};

export const usePermissions = () => {
  const { user, hasRole } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      console.log('🔍 [PERMISSIONS DEBUG] Iniciando carregamento de permissões...');
      console.log('🔍 [PERMISSIONS DEBUG] User objeto completo:', user);
      console.log('🔍 [PERMISSIONS DEBUG] User ID:', user?.id);
      console.log('🔍 [PERMISSIONS DEBUG] User tipo:', user?.tipo);
      console.log('🔍 [PERMISSIONS DEBUG] User nome:', user?.nome);
      
      if (!user?.id) {
        console.log('🔍 [PERMISSIONS DEBUG] Sem user ID, limpando permissões');
        setPermissions([]);
        setLoading(false);
        return;
      }

      // Timeout para evitar travamento durante renovação de token
      const timeoutId = setTimeout(() => {
        console.log('⚠️ [PERMISSIONS DEBUG] Timeout no carregamento, usando permissões padrão');
        const defaultPerms = getDefaultPermissionsByType(user.tipo || 'estoque');
        setPermissions(defaultPerms);
        setLoading(false);
      }, 8000);

      // Master tem todas as permissões
      if (hasRole('master') || user.tipo === 'master') {
        console.log('🔍 [PERMISSIONS DEBUG] Usuário é MASTER, aplicando todas as permissões');
        const masterPermissions = getDefaultPermissionsByType('master');
        setPermissions(masterPermissions);
        setLoading(false);
        clearTimeout(timeoutId);
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

        // Se há permissões específicas, usar essas, caso contrário usar padrões
        if (userPermissions && userPermissions.length > 0) {
          console.log('🔍 [PERMISSIONS DEBUG] Encontradas permissões específicas, processando...');
          
          const specificPermissions: UserPermission[] = userPermissions.map(p => ({
            resource: p.resource as SystemResource,
            action: p.action as PermissionAction,
            enabled: p.enabled
          }));

          console.log('🔍 [PERMISSIONS DEBUG] Permissões específicas processadas:', specificPermissions);
          setPermissions(specificPermissions);
        } else {
          console.log('🔍 [PERMISSIONS DEBUG] Nenhuma permissão específica encontrada, usando permissões padrão');
          const defaultPermissions = getDefaultPermissionsByType(user.tipo || 'estoque');
          setPermissions(defaultPermissions);
        }
        
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (error) {
        console.error('❌ [PERMISSIONS DEBUG] Erro ao buscar permissões específicas:', error);
        console.log('🔍 [PERMISSIONS DEBUG] Fallback para permissões padrão devido ao erro');
        const defaultPermissions = getDefaultPermissionsByType(user.tipo || 'estoque');
        setPermissions(defaultPermissions);
        setLoading(false);
        clearTimeout(timeoutId);
      }
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
    if (hasRole('master') || user?.tipo === 'master') return true;
    
    // Buscar permissão específica primeiro
    const specificPermission = permissions.find(p => 
      p.resource === resource && p.action === action
    );
    
    // Se existe permissão específica, usar ela (mesmo se false)
    if (specificPermission) {
      return specificPermission.enabled;
    }
    
    // Se não existe permissão específica, usar padrão do tipo
    const defaultPermissions = getDefaultPermissionsByType(user?.tipo || 'estoque');
    const defaultPermission = defaultPermissions.find(p => 
      p.resource === resource && p.action === action
    );
    
    return defaultPermission ? true : false; // Padrão é habilitado se existe na lista padrão
  };

  const canView = (resource: SystemResource): boolean => {
    const result = hasPermission(resource, 'view');
    console.log(`🔍 [PERMISSIONS DEBUG] canView(${resource}) = ${result}`, {
      userTipo: user?.tipo,
      userNome: user?.nome,
      permissionsCount: permissions.length,
      specificPermission: permissions.find(p => p.resource === resource && p.action === 'view')
    });
    return result;
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
