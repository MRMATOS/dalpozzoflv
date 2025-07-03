import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { validateInput } from '@/utils/inputValidation';

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
  const loadUserProfile = async (authUser: User, retryCount = 0) => {
    try {
      console.log('Carregando perfil para usuário:', authUser.id, 'tentativa:', retryCount + 1);
      
      // Timeout para evitar carregamento infinito
      const profilePromise = supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout no carregamento do perfil')), 8000)
      );

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (!profileError && profile) {
        // Verificar se usuário está aprovado (exceto masters)
        if (profile.tipo !== 'master' && !profile.aprovado) {
          console.log('Usuário não aprovado ainda');
          setUser(null);
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
        return;
      }

      // Se não encontrou perfil, aguardar o trigger criar
      if (retryCount < 3) {
        console.log('Perfil não encontrado, aguardando trigger criar...', retryCount + 1);
        setTimeout(() => loadUserProfile(authUser, retryCount + 1), 2000);
        return;
      }

      console.error('Perfil não foi criado pelo trigger após várias tentativas');
      setUser(null);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      
      // Retry em caso de erro
      if (retryCount < 2) {
        console.log('Erro no carregamento, tentando novamente em 3s...');
        setTimeout(() => loadUserProfile(authUser, retryCount + 1), 3000);
        return;
      }
      
      setUser(null);
    }
  };

  // Inicializar autenticação
  useEffect(() => {
    console.log('=== INICIALIZANDO AUTENTICAÇÃO GOOGLE ===');

    // Configurar listener de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Verificar sessão existente com timeout
    const sessionTimeout = setTimeout(() => {
      console.warn('Timeout no carregamento da sessão inicial');
      setLoading(false);
    }, 15000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(sessionTimeout);
      if (session?.user) {
        setSession(session);
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    }).catch(error => {
      clearTimeout(sessionTimeout);
      console.error('Erro ao carregar sessão inicial:', error);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          redirectTo: `${window.location.origin}/auth`
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
      
      // Logout do Supabase Auth
      await supabase.auth.signOut();
      
      setUser(null);
      setSession(null);
      
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro no logout:', error);
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