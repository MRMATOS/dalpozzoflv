import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useSecureOperations = () => {
  const { user, hasRole } = useAuth();
  const hasPermission = (role: string) => hasRole(role);

  const secureInsert = useCallback(async (
    table: string, 
    data: any
  ): Promise<{ data?: any; error?: string }> => {
    try {
      if (!user?.id) {
        return { error: 'Usuário não autenticado' };
      }

      const dataWithUser = {
        ...data,
        user_id: user.id
      };

      const { data: result, error } = await supabase
        .from(table as any)
        .insert([dataWithUser])
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      return { data: result };
    } catch (error: any) {
      return { error: error.message || 'Erro interno' };
    }
  }, [user]);

  const secureUpdate = useCallback(async (
    table: string, 
    id: string, 
    data: any
  ): Promise<{ error?: string }> => {
    try {
      if (!user?.id) {
        return { error: 'Usuário não autenticado' };
      }

      const { error } = await supabase
        .from(table as any)
        .update(data)
        .eq('id', id);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'Erro interno' };
    }
  }, [user]);

  return {
    secureInsert,
    secureUpdate,
    hasPermission,
    user
  };
};