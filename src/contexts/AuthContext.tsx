import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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

  // Função para carregar perfil do usuário autenticado
  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Carregando perfil para usuário:', authUser.id);
      
      // Carregar do novo sistema (profiles + user_roles)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profileError && profile) {
        // Carregar role do usuário
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .maybeSingle();

        const userProfile: UserProfile = {
          id: profile.id,
          nome: profile.nome,
          loja: profile.loja,
          google_email: authUser.email,
          tipo: roleData?.role || 'estoque',
          ativo: profile.ativo,
          ultimo_login: profile.ultimo_login
        };

        // Atualizar último login
        await supabase
          .from('profiles')
          .update({ ultimo_login: new Date().toISOString() })
          .eq('id', profile.id);

        console.log('Perfil carregado:', userProfile.nome);
        setUser(userProfile);
        return;
      }

      console.error('Nenhum perfil encontrado para o usuário');
      setUser(null);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
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

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== LOGIN COM GOOGLE ===');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        console.error('Erro no login Google:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Erro no login Google:', error);
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