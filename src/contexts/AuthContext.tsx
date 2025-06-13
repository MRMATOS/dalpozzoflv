
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

  // Função para criar uma sessão anônima no Supabase com o user_id
  const createSupabaseSession = async (userData: UserProfile) => {
    try {
      // Usar o ID do usuário como email temporário para criar sessão
      const tempEmail = `${userData.id}@sistema.local`;
      const tempPassword = userData.codigo_acesso;
      
      console.log('Criando sessão Supabase para usuário:', userData.nome);
      
      // Tentar fazer login primeiro (caso já exista)
      let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: tempPassword,
      });

      // Se não conseguir fazer login, criar usuário
      if (signInError) {
        console.log('Usuário não existe no Auth, criando...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: tempEmail,
          password: tempPassword,
          options: {
            data: {
              user_id: userData.id,
              nome: userData.nome,
              loja: userData.loja,
              tipo: userData.tipo
            }
          }
        });

        if (signUpError) {
          console.warn('Erro ao criar usuário no Auth:', signUpError);
          return;
        }
        
        authData = signUpData;
      }

      if (authData.user) {
        console.log('Sessão Supabase criada com sucesso');
        
        // Verificar se usuário existe na tabela usuarios com o mesmo ID
        const { data: existingUser, error: userError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', userData.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          // Usuário não existe na tabela usuarios, criar
          console.log('Criando registro na tabela usuarios');
          await supabase
            .from('usuarios')
            .insert({
              id: userData.id,
              nome: userData.nome,
              loja: userData.loja,
              codigo_acesso: userData.codigo_acesso,
              tipo: userData.tipo,
              ativo: userData.ativo,
              ultimo_login: userData.ultimo_login
            });
        } else if (!userError) {
          // Usuário existe, atualizar último login
          console.log('Atualizando último login na tabela usuarios');
          await supabase
            .from('usuarios')
            .update({ ultimo_login: new Date().toISOString() })
            .eq('id', userData.id);
        }
      }
    } catch (error) {
      console.error('Erro ao criar sessão Supabase:', error);
    }
  };

  // Check for existing session on load
  useEffect(() => {
    const loadStoredUser = async () => {
      const storedUser = localStorage.getItem('flv_user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Validar dados básicos
          if (!userData.id || !userData.nome || !userData.loja) {
            console.log('Dados de usuário inválidos no localStorage, removendo');
            localStorage.removeItem('flv_user');
            setLoading(false);
            return;
          }
          
          // Verificar se o usuário ainda existe e está ativo no banco
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
              nome: validateInput.text(usuarioAtualizado.nome),
              loja: validateInput.text(usuarioAtualizado.loja),
              codigo_acesso: usuarioAtualizado.codigo_acesso,
              tipo: validateInput.text(usuarioAtualizado.tipo),
              ativo: usuarioAtualizado.ativo,
              ultimo_login: usuarioAtualizado.ultimo_login
            };

            setUser(userDataAtualizado);
            setProfile(userDataAtualizado);
            
            // Criar sessão no Supabase para permitir operações RLS
            await createSupabaseSession(userDataAtualizado);
            
            // Atualizar localStorage com dados mais recentes
            localStorage.setItem('flv_user', JSON.stringify(userDataAtualizado));
            
            console.log('Usuário autenticado carregado:', userDataAtualizado.nome);
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
      // Validar entrada
      const validatedCode = validateInput.codigoAcesso(codigoAcesso);
      
      console.log('Tentando login com código validado');
      
      // Buscar usuário pelo código de acesso na tabela usuarios
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_acesso', validatedCode)
        .eq('ativo', true)
        .single();

      if (usuarioError || !usuario) {
        console.error('Erro ao buscar usuário:', usuarioError);
        return { success: false, error: "Código de acesso inválido ou usuário inativo" };
      }

      console.log('Usuário encontrado:', usuario.nome);

      // Validar dados do usuário
      const userData = {
        id: validateInput.uuid(usuario.id),
        nome: validateInput.text(usuario.nome),
        loja: validateInput.text(usuario.loja),
        codigo_acesso: usuario.codigo_acesso,
        tipo: validateInput.text(usuario.tipo),
        ativo: usuario.ativo,
        ultimo_login: new Date().toISOString()
      };

      // Atualizar último login de forma segura
      try {
        await supabase
          .from('usuarios')
          .update({ ultimo_login: userData.ultimo_login })
          .eq('id', usuario.id);
      } catch (updateError) {
        console.warn('Erro ao atualizar último login:', updateError);
        // Não bloquear o login por conta disso
      }

      // Criar sessão no Supabase para permitir operações RLS
      await createSupabaseSession(userData);

      // Armazenar usuário no localStorage e state
      localStorage.setItem('flv_user', JSON.stringify(userData));
      setUser(userData);
      setProfile(userData);

      console.log('Login realizado com sucesso para:', userData.nome);
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
      console.log('Fazendo logout do usuário:', user?.nome);
      
      // Fazer logout do Supabase também
      await supabase.auth.signOut();
      
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
