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
  data_prevista?: string;
  data_recebimento?: string;
  status_entrega?: string;
  criado_em: string;
  observacoes?: string;
  user_id: string;
  criado_por: string;
}

interface CompradorInfo {
  id: string;
  nome: string;
}

interface FiltrosPedidoCompradores {
  comprador: 'todos' | 'meus' | string; // 'todos', 'meus', ou ID específico do comprador
  fornecedor?: string;
  produto?: string;
  dataInicio?: string;
  dataFim?: string;
}

export const usePedidosCompradores = () => {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<PedidoSimples[]>([]);
  const [compradores, setCompradores] = useState<CompradorInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar lista de compradores
  const buscarCompradores = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('tipo', ['comprador', 'master'])
        .eq('aprovado', true)
        .order('nome');

      if (error) throw error;
      setCompradores(data || []);
    } catch (error) {
      console.error('Erro ao buscar compradores:', error);
    }
  };

  // Buscar pedidos com filtros
  const buscarPedidos = async (filtros: FiltrosPedidoCompradores = { comprador: 'meus' }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('pedidos_simples')
        .select('*')
        .order('criado_em', { ascending: false });

      // Filtro por comprador
      if (filtros.comprador === 'meus') {
        query = query.eq('user_id', user?.id);
      } else if (filtros.comprador !== 'todos') {
        // Comprador específico
        query = query.eq('user_id', filtros.comprador);
      }
      // Se for 'todos', não adiciona filtro de user_id

      // Aplicar outros filtros
      if (filtros.fornecedor && filtros.fornecedor !== 'todos') {
        query = query.eq('fornecedor_nome', filtros.fornecedor);
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
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  // Marcar pedido como recebido
  const marcarComoRecebido = async (pedidoId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_simples')
        .update({ 
          data_recebimento: new Date().toISOString() 
        })
        .eq('id', pedidoId)
        .eq('user_id', user?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar como recebido:', error);
      return false;
    }
  };

  // Excluir pedido
  const excluirPedido = async (pedidoId: string) => {
    try {
      const { error } = await supabase
        .from('pedidos_simples')
        .delete()
        .eq('id', pedidoId)
        .eq('user_id', user?.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      return false;
    }
  };

  // Excluir todos os pedidos de um fornecedor
  const excluirPedidosFornecedor = async (nomeFornecedor: string) => {
    try {
      const { data, error } = await supabase
        .from('pedidos_simples')
        .delete()
        .eq('fornecedor_nome', nomeFornecedor)
        .eq('user_id', user?.id)
        .select();

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Erro ao excluir pedidos do fornecedor:', error);
      return 0;
    }
  };

  // Carregar compradores na inicialização
  useEffect(() => {
    buscarCompradores();
  }, []);

  return {
    pedidos,
    compradores,
    loading,
    buscarPedidos,
    marcarComoRecebido,
    excluirPedido,
    excluirPedidosFornecedor,
  };
};