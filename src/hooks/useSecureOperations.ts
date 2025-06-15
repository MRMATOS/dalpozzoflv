
import { supabase } from '@/integrations/supabase/client';
import { validateInput, sanitizeData } from '@/utils/inputValidation';
import { useSecureAuth } from './useSecureAuth';

// Hook simplificado para operações com o banco de dados (sem RLS)
export const useSecureOperations = () => {
  const { user } = useSecureAuth();

  const secureInsert = async <T extends Record<string, any>>(
    table: string, 
    data: T, 
    requiredRole?: string
  ): Promise<{ data: any; error: string | null }> => {
    try {
      console.log(`=== INSERT SIMPLIFICADO EM ${table.toUpperCase()} ===`);
      
      // Verificar autenticação básica
      if (!user) {
        console.error('Usuário não autenticado');
        return { data: null, error: 'Usuário não autenticado' };
      }

      console.log('Usuário autenticado:', user.nome, 'ID:', user.id);

      // Sanitizar dados
      const sanitizedData = sanitizeData.object(data);
      console.log('Dados sanitizados:', sanitizedData);

      // Adicionar user_id automaticamente se necessário e não estiver presente
      const dataWithUser = {
        ...sanitizedData,
        ...(sanitizedData.user_id === undefined && { user_id: user.id })
      };

      console.log('Dados finais para inserção:', dataWithUser);

      // Inserção direta no Supabase (sem verificações RLS)
      console.log(`Executando INSERT direto em ${table}...`);
      const { data: result, error } = await supabase
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
      console.log(`=== UPDATE SIMPLIFICADO EM ${table.toUpperCase()} ===`);
      
      // Verificar autenticação básica
      if (!user) {
        console.error('Usuário não autenticado');
        return { data: null, error: 'Usuário não autenticado' };
      }

      console.log('Usuário autenticado:', user.nome, 'ID:', user.id);

      // Validar ID
      const validatedId = validateInput.uuid(id);
      console.log('ID validado:', validatedId);

      // Sanitizar dados
      const sanitizedData = sanitizeData.object(data);
      console.log('Dados sanitizados para update:', sanitizedData);

      console.log(`Executando UPDATE direto em ${table} para ID ${validatedId}...`);
      const { data: result, error } = await supabase
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
      console.log(`=== DELETE SIMPLIFICADO EM ${table.toUpperCase()} ===`);
      
      // Verificar autenticação básica
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }

      // Validar ID
      const validatedId = validateInput.uuid(id);

      console.log(`Executando DELETE direto em ${table} para ID ${validatedId}...`);
      const { error } = await supabase
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
