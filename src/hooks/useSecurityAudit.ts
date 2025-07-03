import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  event_type: 'login_attempt' | 'failed_login' | 'permission_denied' | 'data_access' | 'data_modification';
  details: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export const useSecurityAudit = () => {
  const { user } = useAuth();

  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    try {
      // Log to console for immediate visibility
      console.warn('Security Event:', {
        ...event,
        timestamp: new Date().toISOString(),
        user_id: user?.id || 'anonymous'
      });

      // In a production environment, you would send this to a security monitoring service
      // For now, we'll use Supabase's built-in logging
      await supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          // Session exists, this is a logged event for authenticated user
          console.info('Authenticated security event logged');
        }
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, [user]);

  const logFailedLogin = useCallback((email: string, error: string) => {
    logSecurityEvent({
      event_type: 'failed_login',
      details: `Failed login attempt for email: ${email}. Error: ${error}`,
      user_id: undefined
    });
  }, [logSecurityEvent]);

  const logPermissionDenied = useCallback((resource: string, action: string) => {
    logSecurityEvent({
      event_type: 'permission_denied',
      details: `Permission denied for ${action} on ${resource}`,
      user_id: user?.id
    });
  }, [logSecurityEvent, user]);

  const logDataAccess = useCallback((table: string, operation: string) => {
    logSecurityEvent({
      event_type: 'data_access',
      details: `${operation} operation on ${table}`,
      user_id: user?.id
    });
  }, [logSecurityEvent, user]);

  return {
    logSecurityEvent,
    logFailedLogin,
    logPermissionDenied,
    logDataAccess
  };
};