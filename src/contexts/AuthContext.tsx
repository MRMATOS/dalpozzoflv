
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  nome: string;
  loja: string;
  codigo_acesso: string;
  tipo: string;
  ativo: boolean;
  ultimo_login?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  session: any;
  signOut: () => Promise<void>;
  loading: boolean;
  hasRole: (role: string) => boolean;
  signIn: (codigoAcesso: string) => Promise<{ success: boolean; error?: string }>;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on load
  useEffect(() => {
    const loadStoredUser = async () => {
      const storedUser = localStorage.getItem('flv_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Verificar se o usuário ainda existe e está ativo, e buscar dados atualizados
          const { data: usuarioAtualizado, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userData.id)
            .eq('ativo', true)
            .single();

          if (error || !usuarioAtualizado) {
            console.log('Usuário não encontrado ou inativo, removendo do localStorage');
            localStorage.removeItem('flv_user');
          } else {
            // Usar dados atualizados do banco
            const userDataAtualizado = {
              id: usuarioAtualizado.id,
              nome: usuarioAtualizado.nome,
              loja: usuarioAtualizado.loja, // Nome da loja já padronizado
              codigo_acesso: usuarioAtualizado.codigo_acesso,
              tipo: usuarioAtualizado.tipo,
              ativo: usuarioAtualizado.ativo,
              ultimo_login: usuarioAtualizado.ultimo_login
            };

            setUser(userDataAtualizado);
            setProfile(userDataAtualizado);
            
            // Atualizar localStorage com dados mais recentes
            localStorage.setItem('flv_user', JSON.stringify(userDataAtualizado));
          }
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('flv_user');
        }
      }
      setLoading(false);
    };

    loadStoredUser();
  }, []);

  const signIn = async (codigoAcesso: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Tentando login com código:', codigoAcesso.trim());
      
      // Buscar usuário pelo código de acesso na tabela usuarios
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_acesso', codigoAcesso.trim())
        .eq('ativo', true)
        .single();

      if (usuarioError || !usuario) {
        console.error('Erro ao buscar usuário:', usuarioError);
        return { success: false, error: "Código de acesso inválido ou usuário inativo" };
      }

      console.log('Usuário encontrado:', usuario);

      // Atualizar último login
      await supabase
        .from('usuarios')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', usuario.id);

      // Armazenar usuário no localStorage e state
      const userData = {
        id: usuario.id,
        nome: usuario.nome,
        loja: usuario.loja, // Nome da loja já padronizado
        codigo_acesso: usuario.codigo_acesso,
        tipo: usuario.tipo,
        ativo: usuario.ativo,
        ultimo_login: new Date().toISOString()
      };

      localStorage.setItem('flv_user', JSON.stringify(userData));
      setUser(userData);
      setProfile(userData);

      return { success: true };
    } catch (error: any) {
      console.error('Erro no login:', error);
      return { success: false, error: "Erro interno. Tente novamente." };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('flv_user');
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Signout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    return profile?.tipo === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session: user ? { user } : null,
      signOut,
      loading,
      hasRole,
      signIn
    }}>
      {children}
    </AuthContext.Provider>
  );
};
