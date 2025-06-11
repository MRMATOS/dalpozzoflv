
import { useAuth } from '@/contexts/AuthContext';
import { validateInput } from '@/utils/inputValidation';
import { useCallback } from 'react';

// Hook para operações de autenticação seguras
export const useSecureAuth = () => {
  const { signIn, user, hasRole } = useAuth();

  const secureSignIn = useCallback(async (codigoAcesso: string) => {
    try {
      // Validar entrada
      const validatedCode = validateInput.codigoAcesso(codigoAcesso);
      
      console.log('Tentativa de login com código validado');
      
      // Fazer login
      const result = await signIn(validatedCode);
      
      if (!result.success) {
        console.warn('Tentativa de login falhada:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Erro na validação do código de acesso:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro de validação' 
      };
    }
  }, [signIn]);

  const hasPermission = useCallback((requiredRole: string): boolean => {
    if (!user) return false;
    
    // Master tem todas as permissões
    if (hasRole('master')) return true;
    
    // Verificar role específica
    return hasRole(requiredRole);
  }, [user, hasRole]);

  const canAccessLoja = useCallback((lojaName: string): boolean => {
    if (!user) return false;
    
    // Master pode acessar todas as lojas
    if (hasRole('master')) return true;
    
    // Usuário só pode acessar sua própria loja
    return user.loja === lojaName;
  }, [user, hasRole]);

  const isOwner = useCallback((userId: string): boolean => {
    if (!user) return false;
    
    // Master pode acessar tudo
    if (hasRole('master')) return true;
    
    // Verificar se é o próprio usuário
    return user.id === userId;
  }, [user, hasRole]);

  return {
    secureSignIn,
    hasPermission,
    canAccessLoja,
    isOwner,
    user,
    isAuthenticated: !!user
  };
};
