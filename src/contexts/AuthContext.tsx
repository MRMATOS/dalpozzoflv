
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateInput } from '@/utils/inputValidation';

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

  // Carregar usuário do localStorage na inicialização
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('=== INICIALIZANDO AUTENTICAÇÃO ORIGINAL ===');
      
      const storedUser = localStorage.getItem('flv_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Usuário encontrado no localStorage:', userData.nome);
          
          // Validar dados básicos
          if (!userData.id || !userData.nome || !userData.loja) {
            console.log('Dados inválidos, removendo do localStorage');
            localStorage.removeItem('flv_user');
            setLoading(false);
            return;
          }
          
          // Verificar se ainda está ativo no banco
          const { data: usuarioAtivo, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', userData.id)
            .eq('ativo', true)
            .maybeSingle();

          if (error || !usuarioAtivo) {
            console.log('Usuário não encontrado ou inativo, removendo sessão');
            localStorage.removeItem('flv_user');
            setLoading(false);
            return;
          }

          // Dados atualizados do banco
          const userDataAtualizado = {
            id: usuarioAtivo.id,
            nome: validateInput.text(usuarioAtivo.nome),
            loja: validateInput.text(usuarioAtivo.loja),
            codigo_acesso: usuarioAtivo.codigo_acesso,
            tipo: validateInput.text(usuarioAtivo.tipo),
            ativo: usuarioAtivo.ativo,
            ultimo_login: usuarioAtivo.ultimo_login
          };

          setUser(userDataAtualizado);
          setProfile(userDataAtualizado);
          console.log('Usuário autenticado:', userDataAtualizado.nome);
        } catch (error) {
          console.error('Erro ao inicializar autenticação:', error);
          localStorage.removeItem('flv_user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (codigoAcesso: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== PROCESSO DE LOGIN ORIGINAL ===');
      
      // Validar entrada
      const validatedCode = validateInput.codigoAcesso(codigoAcesso);
      console.log('Código validado, buscando usuário...');
      
      // Buscar usuário na tabela usuarios
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_acesso', validatedCode)
        .eq('ativo', true)
        .maybeSingle();

      if (usuarioError || !usuario) {
        console.error('Erro ao buscar usuário:', usuarioError);
        return { success: false, error: "Código de acesso inválido ou usuário inativo" };
      }

      console.log('Usuário encontrado:', usuario.nome);

      // Preparar dados do usuário
      const userData = {
        id: validateInput.uuid(usuario.id),
        nome: validateInput.text(usuario.nome),
        loja: validateInput.text(usuario.loja),
        codigo_acesso: usuario.codigo_acesso,
        tipo: validateInput.text(usuario.tipo),
        ativo: usuario.ativo,
        ultimo_login: new Date().toISOString()
      };

      // Atualizar último login na base
      await supabase
        .from('usuarios')
        .update({ ultimo_login: userData.ultimo_login })
        .eq('id', userData.id);

      // Definir estados
      setUser(userData);
      setProfile(userData);
      localStorage.setItem('flv_user', JSON.stringify(userData));

      console.log('Login realizado com sucesso:', userData.nome);
      return { success: true };
    } catch (error: any) {
      console.error('Erro no login:', error);
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
      
      // Limpar dados locais
      localStorage.removeItem('flv_user');
      setUser(null);
      setProfile(null);
      
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string): boolean => {
    if (!profile?.tipo) return false;
    return profile.tipo === role;
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
