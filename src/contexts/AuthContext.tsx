import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { validateInput } from '@/utils/inputValidation';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  nome: string;
  loja: string;
  google_email?: string;
  tipo: string;
  ativo: boolean;
  ultimo_login?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  hasRole: (role: string) => boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar perfil do usuário autenticado usando tabela usuarios
  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Carregando perfil para usuário:', authUser.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profileError) {
        console.error('Erro ao carregar perfil:', profileError);
        setUser(null);
        return;
      }

      if (!profile) {
        console.log('Perfil não encontrado. Usuário ainda não foi processado pelo trigger.');
        setUser(null);
        return;
      }

      // Verificar se usuário está aprovado
      if (!profile.aprovado) {
        console.log('Usuário aguardando aprovação');
        setUser({
          id: profile.id,
          nome: profile.nome,
          loja: profile.loja,
          google_email: authUser.email,
          tipo: profile.tipo || 'estoque',
          ativo: profile.ativo,
          ultimo_login: profile.ultimo_login,
          pendingApproval: true
        } as UserProfile & { pendingApproval: boolean });
        setLoading(false);
        return;
      }

      const userProfile: UserProfile = {
        id: profile.id,
        nome: profile.nome,
        loja: profile.loja,
        google_email: authUser.email,
        tipo: profile.tipo || 'estoque',
        ativo: profile.ativo,
        ultimo_login: profile.ultimo_login
      };

      // Atualizar último login (sem aguardar para não atrasar)
      supabase
        .from('usuarios')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', profile.id);

      console.log('Perfil carregado:', userProfile.nome);
      setUser(userProfile);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setUser(null);
    }
  };

  // Inicializar autenticação
  useEffect(() => {
    console.log('=== INICIALIZANDO AUTENTICAÇÃO GOOGLE ===');
    let mounted = true;

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        // Atualizar sessão sempre
        setSession(session);
        
        if (session?.user) {
          // Defer async operations to prevent deadlock
          setTimeout(() => {
            if (mounted) {
              loadUserProfile(session.user);
            }
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Verificar sessão existente com timeout reduzido
    const sessionTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Timeout no carregamento da sessão inicial');
        setLoading(false);
      }
    }, 5000);

    // Carregar sessão inicial
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(sessionTimeout);
        
        if (!mounted) return;
        
        if (error) {
          console.error('Erro ao carregar sessão:', error);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          setSession(session);
          await loadUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        clearTimeout(sessionTimeout);
        console.error('Erro na inicialização da auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(sessionTimeout);
    };
  }, []); // Removed user dependency to prevent infinite loops

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Rate limiting check (simple client-side implementation)
      const lastAttempt = localStorage.getItem('lastLoginAttempt');
      const now = Date.now();
      if (lastAttempt && (now - parseInt(lastAttempt)) < 2000) { // 2 second cooldown
        return { success: false, error: 'Muitas tentativas. Aguarde um momento.' };
      }
      localStorage.setItem('lastLoginAttempt', now.toString());

      console.log('=== LOGIN COM GOOGLE ===');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        console.error('Erro no login Google:', error);
        // Log security event for failed login
        console.warn('Security Event: Failed Google OAuth attempt', { 
          error: error.message, 
          timestamp: new Date().toISOString(),
          ip: 'client-side'
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro no login Google:', error);
      console.warn('Security Event: Google OAuth exception', { 
        error: error.message, 
        timestamp: new Date().toISOString(),
        ip: 'client-side'
      });
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro interno. Tente novamente." 
      };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      console.log('=== FAZENDO LOGOUT ===');
      
      // Limpar estado local primeiro
      setUser(null);
      setSession(null);
      
      // Logout do Supabase Auth com escopo para forçar revogação do Google
      await supabase.auth.signOut({
        scope: 'global'
      });
      
      // Limpar localStorage e sessionStorage
      localStorage.removeItem('lastLoginAttempt');
      sessionStorage.clear();
      
      // Redirecionar para página de login
      window.location.href = '/auth';
      
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro no logout:', error);
      // Mesmo com erro, redirecionar
      window.location.href = '/auth';
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    if (!user?.tipo) return false;
    
    // Usuários master têm acesso a todos os roles
    if (user.tipo === 'master') {
      console.log('Usuário master tem acesso total ao role:', role);
      return true;
    }
    
    // Para outros usuários, verificar igualdade exata
    return user.tipo === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile: user,
      session,
      loading,
      hasRole,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};