
// Utilitário para logging de segurança (apenas em desenvolvimento)
export const securityLogger = {
  logAccess: (resource: string, action: string, userId?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${action} em ${resource} por usuário ${userId || 'anônimo'}`);
    }
  },

  logAuthAttempt: (success: boolean, details?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] Tentativa de login: ${success ? 'SUCESSO' : 'FALHA'} ${details || ''}`);
    }
  },

  logPermissionDenied: (resource: string, userId?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[SECURITY] Acesso negado a ${resource} para usuário ${userId || 'anônimo'}`);
    }
  },

  logDataOperation: (operation: string, table: string, userId?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DATA] ${operation} em ${table} por usuário ${userId || 'anônimo'}`);
    }
  }
};
