
import { supabase } from '@/integrations/supabase/client';
import { validateInput, sanitizeData } from '@/utils/inputValidation';
import { useSecureAuth } from './useSecureAuth';
import { toast } from 'sonner';

// Hook para operações seguras com o banco de dados
export const useSecureOperations = () => {
  const { user, hasPermission } = useSecureAuth();

  const secureInsert = async <T extends Record<string, any>>(
    table: string, 
    data: T, 
    requiredRole?: string
  ): Promise<{ data: any; error: string | null }> => {
    try {
      // Verificar autenticação
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      // Verificar permissão se necessário
      if (requiredRole && !hasPermission(requiredRole)) {
        return { data: null, error: 'Permissão insuficiente' };
      }

      // Sanitizar dados
      const sanitizedData = sanitizeData.object(data);

      // Adicionar user_id automaticamente se o campo existir e não estiver presente
      const dataWithUser = {
        ...sanitizedData,
        ...(sanitizedData.user_id === undefined && { user_id: user.id })
      };

      console.log(`Inserindo dados em ${table}:`, dataWithUser);

      // Verificar se temos uma sessão ativa no Supabase
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.warn('Sessão Supabase não encontrada, tentando operação direta');
      }

      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(dataWithUser)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao inserir em ${table}:`, error);
        
        // Se for erro de RLS, tentar explicar melhor
        if (error.message.includes('row-level security policy')) {
          return { 
            data: null, 
            error: `Erro de permissão: usuário não autorizado a inserir dados em ${table}` 
          };
        }
        
        return { data: null, error: error.message };
      }

      console.log(`Dados inseridos com sucesso em ${table}:`, result);
      return { data: result, error: null };
    } catch (error) {
      console.error(`Erro na operação de inserção em ${table}:`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  };

  const secureUpdate = async <T extends Record<string, any>>(
    table: string, 
    id: string, 
    data: T, 
    requiredRole?: string
  ): Promise<{ data: any; error: string | null }> => {
    try {
      // Verificar autenticação
      if (!user) {
        return { data: null, error: 'Usuário não autenticado' };
      }

      // Validar ID
      const validatedId = validateInput.uuid(id);

      // Verificar permissão se necessário
      if (requiredRole && !hasPermission(requiredRole)) {
        return { data: null, error: 'Permissão insuficiente' };
      }

      // Sanitizar dados
      const sanitizedData = sanitizeData.object(data);

      console.log(`Atualizando dados em ${table} (ID: ${validatedId}):`, sanitizedData);

      const { data: result, error } = await (supabase as any)
        .from(table)
        .update(sanitizedData)
        .eq('id', validatedId)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao atualizar em ${table}:`, error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error(`Erro na operação de atualização em ${table}:`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  };

  const secureDelete = async (
    table: string, 
    id: string, 
    requiredRole: string = 'master'
  ): Promise<{ success: boolean; error: string | null }> => {
    try {
      // Verificar autenticação
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Validar ID
      const validatedId = validateInput.uuid(id);

      // Verificar permissão
      if (!hasPermission(requiredRole)) {
        return { success: false, error: 'Permissão insuficiente para deletar' };
      }

      console.log(`Deletando registro em ${table} (ID: ${validatedId})`);

      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', validatedId);

      if (error) {
        console.error(`Erro ao deletar em ${table}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error(`Erro na operação de deleção em ${table}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  };

  return {
    secureInsert,
    secureUpdate,
    secureDelete
  };
};
