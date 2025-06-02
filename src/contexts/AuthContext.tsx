
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  nome: string;
  tipo: string;
  loja: string;
  codigo_acesso: string;
  ativo: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (codigo: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se existe usuário logado no localStorage
    const savedUser = localStorage.getItem('flv_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (codigo: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('codigo_acesso', codigo.trim())
        .eq('ativo', true)
        .single();

      if (error || !data) {
        return { success: false, error: 'Código incorreto' };
      }

      // Simular lógica de primeiro acesso e código expirado
      if (codigo === 'first') {
        return { success: false, error: 'Primeiro acesso detectado. Altere seu código.' };
      }
      
      if (codigo === 'expired') {
        return { success: false, error: 'Código expirado. Solicite um novo.' };
      }

      const userData: User = {
        id: data.id,
        nome: data.nome,
        tipo: data.tipo,
        loja: data.loja,
        codigo_acesso: data.codigo_acesso,
        ativo: data.ativo
      };

      setUser(userData);
      localStorage.setItem('flv_user', JSON.stringify(userData));

      // Atualizar último login
      await supabase
        .from('usuarios')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', data.id);

      return { success: true };
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro interno. Tente novamente.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('flv_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
