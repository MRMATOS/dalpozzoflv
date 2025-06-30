
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { validateInput } from '@/utils/inputValidation';

interface UserProfile {
  id: string;
  nome: string;
  loja: string;
  codigo_acesso?: string;
  google_email?: string;
  tipo: string;
  ativo: boolean;
  ultimo_login?: string;
}

interface HybridAuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  hasRole: (role: string) => boolean;
  signInWithCode: (codigoAcesso: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const HybridAuthContext = createContext<HybridAuthContextType | undefined>(undefined);

export const useHybridAuth = () => {
  const context = useContext(HybridAuthContext);
  if (context === undefined) {
    throw new Error('useHybridAuth must be used within a HybridAuthProvider');
  }
  return context;
};

export const HybridAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar perfil do usuário autenticado
  const loadUserProfile = async (authUser: User) => {
    try {
      console.log('Carregando perfil para usuário:', authUser.id);
      
      // Tentar carregar do novo sistema (profiles + user_roles)
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
          codigo_acesso: profile.codigo_acesso,
          google_email: authUser.email, // Use email from auth user
          tipo: roleData?.role || 'estoque',
          ativo: profile.ativo,
          ultimo_login: profile.ultimo_login
        };

        console.log('Perfil carregado (novo sistema):', userProfile.nome);
        setUser(userProfile);
        return;
      }

      // Fallback para o sistema antigo (usuarios)
      const { data: usuarioAntigo, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authUser.id)
        .eq('ativo', true)
        .maybeSingle();

      if (!usuarioError && usuarioAntigo) {
        const userProfile: UserProfile = {
          id: usuarioAntigo.id,
          nome: usuarioAntigo.nome,
          loja: usuarioAntigo.loja,
          codigo_acesso: usuarioAntigo.codigo_acesso,
          tipo: usuarioAntigo.tipo,
          ativo: usuarioAntigo.ativo,
          ultimo_login: usuarioAntigo.ultimo_login
          // Note: no google_email for old system users
        };

        console.log('Perfil carregado (sistema antigo):', userProfile.nome);
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
    console.log('=== INICIALIZANDO AUTENTICAÇÃO HÍBRIDA ===');

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
        // Verificar usuário logado no sistema antigo
        const storedUser = localStorage.getItem('flv_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            console.log('Usuário do sistema antigo mantido:', userData.nome);
          } catch (error) {
            console.error('Erro ao recuperar usuário do localStorage:', error);
            localStorage.removeItem('flv_user');
          }
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithCode = async (codigoAcesso: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== LOGIN COM CÓDIGO (SISTEMA ANTIGO) ===');
      
      const validatedCode = validateInput.codigoAcesso(codigoAcesso);
      
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_acesso', validatedCode)
        .eq('ativo', true)
        .maybeSingle();

      if (usuarioError || !usuario) {
        return { success: false, error: "Código de acesso inválido ou usuário inativo" };
      }

      const userData: UserProfile = {
        id: validateInput.uuid(usuario.id),
        nome: validateInput.text(usuario.nome),
        loja: validateInput.text(usuario.loja),
        codigo_acesso: usuario.codigo_acesso,
        tipo: validateInput.text(usuario.tipo),
        ativo: usuario.ativo,
        ultimo_login: new Date().toISOString()
      };

      // Atualizar último login
      await supabase
        .from('usuarios')
        .update({ ultimo_login: userData.ultimo_login })
        .eq('id', userData.id);

      setUser(userData);
      localStorage.setItem('flv_user', JSON.stringify(userData));

      console.log('Login com código realizado:', userData.nome);
      return { success: true };
    } catch (error: any) {
      console.error('Erro no login com código:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro interno. Tente novamente." 
      };
    }
  };

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
      
      // Limpar dados locais
      localStorage.removeItem('flv_user');
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
    <HybridAuthContext.Provider value={{
      user,
      session,
      loading,
      hasRole,
      signInWithCode,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </HybridAuthContext.Provider>
  );
};
