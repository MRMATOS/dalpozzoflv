import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PedidoSimples {
  id: string;
  fornecedor_nome: string;
  produto_nome: string;
  unidade: string;
  tipo?: string;
  quantidade: number;
  valor_unitario: number;
  valor_total_estimado: number;
  data_pedido: string;
  criado_em: string;
  observacoes?: string;
}

interface FiltrosPedido {
  fornecedor?: string;
  produto?: string;
  dataInicio?: string;
  dataFim?: string;
}

export const usePedidosSimples = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoSimples[]>([]);
  const [loading, setLoading] = useState(false);

  const buscarPedidos = async (filtros: FiltrosPedido = {}) => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('pedidos_simples')
        .select('*')
        .eq('user_id', user.id)
        .order('criado_em', { ascending: false });

      // Aplicar filtros
      if (filtros.fornecedor) {
        query = query.ilike('fornecedor_nome', `%${filtros.fornecedor}%`);
      }
      if (filtros.produto) {
        query = query.ilike('produto_nome', `%${filtros.produto}%`);
      }
      if (filtros.dataInicio) {
        query = query.gte('data_pedido', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        query = query.lte('data_pedido', filtros.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPedidos(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar pedidos:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const criarPedido = async (dadosPedido: Omit<PedidoSimples, 'id' | 'criado_em'>) => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('pedidos_simples')
      .insert({
        ...dadosPedido,
        user_id: user.id,
        criado_por: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    pedidos,
    loading,
    buscarPedidos,
    criarPedido
  };
};