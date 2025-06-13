
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
      console.log(`=== SECURE INSERT EM ${table.toUpperCase()} ===`);
      
      // Verificar autenticação
      if (!user) {
        console.error('Usuário não autenticado');
        return { data: null, error: 'Usuário não autenticado' };
      }

      console.log('Usuário autenticado:', user.nome, 'ID:', user.id);

      // Verificar permissão se necessário
      if (requiredRole && !hasPermission(requiredRole)) {
        console.error('Permissão insuficiente:', requiredRole);
        return { data: null, error: 'Permissão insuficiente' };
      }

      // Sanitizar dados
      const sanitizedData = sanitizeData.object(data);
      console.log('Dados sanitizados:', sanitizedData);

      // Adicionar user_id automaticamente se necessário
      const dataWithUser = {
        ...sanitizedData,
        ...(sanitizedData.user_id === undefined && { user_id: user.id })
      };

      console.log('Dados finais para inserção:', dataWithUser);

      // Verificar sessão Supabase
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('Status da sessão Supabase:', {
        hasSession: !!session.session,
        userId: session.session?.user?.id,
        error: sessionError
      });

      if (!session.session) {
        console.error('CRÍTICO: Sessão Supabase não encontrada');
        return { data: null, error: 'Sessão expirada. Faça login novamente.' };
      }

      // Realizar inserção
      console.log(`Executando INSERT em ${table}...`);
      const { data: result, error } = await (supabase as any)
        .from(table)
        .insert(dataWithUser)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao inserir em ${table}:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        // Tratamento específico para diferentes tipos de erro
        if (error.message.includes('row-level security policy')) {
          return { 
            data: null, 
            error: `Erro de permissão: não autorizado a inserir em ${table}` 
          };
        }
        
        if (error.message.includes('duplicate key value')) {
          return { 
            data: null, 
            error: 'Registro duplicado. Verifique os dados e tente novamente.' 
          };
        }
        
        return { data: null, error: error.message };
      }

      console.log(`Sucesso! Dados inseridos em ${table}:`, result);
      return { data: result, error: null };
    } catch (error) {
      console.error(`Erro crítico na operação de inserção em ${table}:`, error);
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
      console.log(`=== SECURE UPDATE EM ${table.toUpperCase()} ===`);
      
      // Verificar autenticação
      if (!user) {
        console.error('Usuário não autenticado');
        return { data: null, error: 'Usuário não autenticado' };
      }

      console.log('Usuário autenticado:', user.nome, 'ID:', user.id);

      // Validar ID
      const validatedId = validateInput.uuid(id);
      console.log('ID validado:', validatedId);

      // Verificar permissão se necessário
      if (requiredRole && !hasPermission(requiredRole)) {
        console.error('Permissão insuficiente:', requiredRole);
        return { data: null, error: 'Permissão insuficiente' };
      }

      // Sanitizar dados
      const sanitizedData = sanitizeData.object(data);
      console.log('Dados sanitizados para update:', sanitizedData);

      // Verificar sessão Supabase
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        console.error('CRÍTICO: Sessão Supabase não encontrada');
        return { data: null, error: 'Sessão expirada. Faça login novamente.' };
      }

      console.log(`Executando UPDATE em ${table} para ID ${validatedId}...`);
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

      console.log(`Sucesso! Dados atualizados em ${table}:`, result);
      return { data: result, error: null };
    } catch (error) {
      console.error(`Erro crítico na operação de atualização em ${table}:`, error);
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
      console.log(`=== SECURE DELETE EM ${table.toUpperCase()} ===`);
      
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

      // Verificar sessão Supabase
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        return { success: false, error: 'Sessão expirada. Faça login novamente.' };
      }

      console.log(`Executando DELETE em ${table} para ID ${validatedId}...`);
      const { error } = await (supabase as any)
        .from(table)
        .delete()
        .eq('id', validatedId);

      if (error) {
        console.error(`Erro ao deletar em ${table}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`Sucesso! Registro deletado em ${table}`);
      return { success: true, error: null };
    } catch (error) {
      console.error(`Erro crítico na operação de deleção em ${table}:`, error);
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
