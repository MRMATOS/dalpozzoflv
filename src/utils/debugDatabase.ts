
import { supabase } from '@/integrations/supabase/client';

export const debugUserAndTables = async (userId: string) => {
  console.log('=== DEBUG DATABASE STRUCTURE ===');
  
  try {
    // Verificar usuário na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('Usuário na tabela usuarios:', { usuario, usuarioError });

    // Verificar usuário na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    console.log('Usuário na tabela profiles:', { profile, profileError });

    // Verificar estrutura da tabela pedidos_compra
    const { data: pedidosTest, error: pedidosError } = await supabase
      .from('pedidos_compra')
      .select('*')
      .limit(1);
    
    console.log('Teste acesso pedidos_compra:', { pedidosTest, pedidosError });

    // Verificar estrutura da tabela fornecedores
    const { data: fornecedoresTest, error: fornecedoresError } = await supabase
      .from('fornecedores')
      .select('*')
      .limit(1);
    
    console.log('Teste acesso fornecedores:', { fornecedoresTest, fornecedoresError });

    return {
      usuario,
      profile,
      canAccessPedidos: !pedidosError,
      canAccessFornecedores: !fornecedoresError
    };
  } catch (error) {
    console.error('Erro no debug:', error);
    return null;
  }
};
