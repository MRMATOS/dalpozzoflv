
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

  // Criar sessão definitiva no Supabase Auth
  const createDefinitiveSupabaseSession = async (userData: UserProfile): Promise<boolean> => {
    try {
      console.log('=== CRIANDO SESSÃO DEFINITIVA SUPABASE ===');
      console.log('User data:', userData);
      
      // Usar um email determinístico baseado no ID
      const deterministicEmail = `user-${userData.id}@flv.local`;
      const password = `flv-${userData.codigo_acesso}-${userData.id}`;
      
      console.log('Email determinístico:', deterministicEmail);
      
      // Primeiro, tentar fazer logout de qualquer sessão existente
      await supabase.auth.signOut();
      
      // Tentar fazer login
      console.log('Tentando login...');
      let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: deterministicEmail,
        password: password,
      });

      if (signInError) {
        console.log('Login falhou, criando usuário:', signInError.message);
        
        // Se login falhar, criar usuário
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: deterministicEmail,
          password: password,
          options: {
            data: {
              system_user_id: userData.id,
              nome: userData.nome,
              loja: userData.loja,
              tipo: userData.tipo
            }
          }
        });

        if (signUpError) {
          console.error('Erro ao criar usuário:', signUpError);
          
          // Se falhou porque usuário já existe, tentar login novamente
          if (signUpError.message.includes('already registered')) {
            console.log('Usuário existe, tentando login novamente...');
            const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
              email: deterministicEmail,
              password: password,
            });
            
            if (retryError) {
              console.error('Retry login falhou:', retryError);
              return false;
            }
            authData = retryAuth;
          } else {
            return false;
          }
        } else {
          authData = signUpData;
        }
      }

      if (authData.user) {
        console.log('Sessão Supabase criada com sucesso:', authData.user.id);
        
        // Sincronizar com tabela usuarios
        await syncUsuariosTable(userData, authData.user.id);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro crítico na criação de sessão:', error);
      return false;
    }
  };

  // Sincronizar dados na tabela usuarios
  const syncUsuariosTable = async (userData: UserProfile, authUserId: string) => {
    try {
      console.log('Sincronizando tabela usuarios...');
      
      // Verificar se registro existe
      const { data: existingUser, error: selectError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userData.id)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Erro ao verificar usuário existente:', selectError);
        return;
      }

      if (!existingUser) {
        // Inserir novo registro
        console.log('Inserindo novo usuário na tabela usuarios');
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            id: userData.id,
            nome: userData.nome,
            loja: userData.loja,
            codigo_acesso: userData.codigo_acesso,
            tipo: userData.tipo,
            ativo: userData.ativo,
            ultimo_login: new Date().toISOString()
          });

        if (insertError) {
          console.error('Erro ao inserir usuário:', insertError);
        } else {
          console.log('Usuário inserido com sucesso');
        }
      } else {
        // Atualizar último login
        console.log('Atualizando último login');
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ ultimo_login: new Date().toISOString() })
          .eq('id', userData.id);

        if (updateError) {
          console.error('Erro ao atualizar último login:', updateError);
        }
      }
    } catch (error) {
      console.error('Erro na sincronização da tabela usuarios:', error);
    }
  };

  // Carregar usuário armazenado e garantir sessão ativa
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('=== INICIALIZANDO AUTENTICAÇÃO ===');
      
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
            await supabase.auth.signOut();
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

          // Criar sessão definitiva no Supabase
          const sessionCreated = await createDefinitiveSupabaseSession(userDataAtualizado);
          
          if (sessionCreated) {
            setUser(userDataAtualizado);
            setProfile(userDataAtualizado);
            localStorage.setItem('flv_user', JSON.stringify(userDataAtualizado));
            console.log('Usuário autenticado e sessão Supabase ativa:', userDataAtualizado.nome);
          } else {
            console.error('Falha ao criar sessão Supabase');
            localStorage.removeItem('flv_user');
          }
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
      console.log('=== PROCESSO DE LOGIN ===');
      
      // Validar entrada
      const validatedCode = validateInput.codigoAcesso(codigoAcesso);
      console.log('Código validado, buscando usuário...');
      
      // Buscar usuário
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

      // Criar sessão definitiva no Supabase
      console.log('Criando sessão Supabase...');
      const sessionCreated = await createDefinitiveSupabaseSession(userData);
      
      if (!sessionCreated) {
        console.error('Falha crítica: não foi possível criar sessão Supabase');
        return { success: false, error: "Erro interno de autenticação. Tente novamente." };
      }

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
      
      // Logout do Supabase
      await supabase.auth.signOut();
      
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
