import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoCotacao {
  id: string;
  criado_em: string;
  total: number;
  fornecedor_nome: string;
  quantidade_itens: number;
  usuario_nome: string;
  usuario_loja: string;
  tipo: 'cotacao';
}

export interface PedidoSimples {
  id: string;
  criado_em: string;
  data_pedido: string;
  valor_total_estimado: number;
  fornecedor_nome: string;
  produto_nome: string;
  quantidade: number;
  unidade: string;
  valor_unitario: number;
  usuario_nome: string;
  usuario_loja: string;
  observacoes?: string;
  tipo: 'simples';
}

export interface Filtros {
  usuario: string;
  fornecedor: string;
  produto: string;
  dataInicio: string;
  dataFim: string;
}

export const useHistoricoPedidosCompleto = () => {
  const { user, profile } = useAuth();
  const [pedidosCotacao, setPedidosCotacao] = useState<PedidoCotacao[]>([]);
  const [pedidosSimples, setPedidosSimples] = useState<PedidoSimples[]>([]);
  const [compradores, setCompradores] = useState<Array<{ id: string; nome: string; loja: string }>>([]);
  const [loadingCotacao, setLoadingCotacao] = useState(false);
  const [loadingSimples, setLoadingSimples] = useState(false);
  
  const isComprador = profile?.tipo === 'comprador';
  const isMaster = profile?.tipo === 'master';

  // Buscar lista de compradores para o filtro
  useEffect(() => {
    if (isComprador || isMaster) {
      buscarCompradores();
    }
  }, [isComprador, isMaster]);

  const buscarCompradores = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, loja')
        .eq('tipo', 'comprador')
        .eq('aprovado', true)
        .order('nome');

      if (error) throw error;
      setCompradores(data || []);
    } catch (error) {
      console.error('Erro ao buscar compradores:', error);
    }
  };

  const buscarPedidosCotacao = async (filtros: Filtros) => {
    setLoadingCotacao(true);
    try {
      let query = supabase
        .from('pedidos_compra')
        .select(`
          id,
          criado_em,
          total,
          user_id,
          fornecedores!inner(nome)
        `);

      // Aplicar filtros de usuário
      if (filtros.usuario === 'meus') {
        query = query.eq('user_id', user?.id);
      } else if (filtros.usuario && filtros.usuario !== 'todos') {
        query = query.eq('user_id', filtros.usuario);
      }

      // Aplicar outros filtros
      if (filtros.fornecedor) {
        query = query.ilike('fornecedores.nome', `%${filtros.fornecedor}%`);
      }
      if (filtros.dataInicio) {
        query = query.gte('criado_em', filtros.dataInicio);
      }
      if (filtros.dataFim) {
        query = query.lte('criado_em', filtros.dataFim + 'T23:59:59');
      }

      const { data: pedidos, error } = await query.order('criado_em', { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários e contagem de itens
      const pedidosComDetalhes = await Promise.all(
        (pedidos || []).map(async (pedido: any) => {
          // Buscar dados do usuário
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('nome, loja')
            .eq('id', pedido.user_id)
            .single();

          // Contar itens do pedido
          const { data: itens } = await supabase
            .from('itens_pedido')
            .select('id')
            .eq('pedido_id', pedido.id);

          return {
            id: pedido.id,
            criado_em: pedido.criado_em,
            total: pedido.total,
            fornecedor_nome: pedido.fornecedores?.nome || 'Não informado',
            quantidade_itens: itens?.length || 0,
            usuario_nome: usuario?.nome || 'Não identificado',
            usuario_loja: usuario?.loja || '',
            tipo: 'cotacao' as const
          };
        })
      );

      setPedidosCotacao(pedidosComDetalhes);
    } catch (error) {
      console.error('Erro ao buscar pedidos de cotação:', error);
    } finally {
      setLoadingCotacao(false);
    }
  };

  const buscarPedidosSimples = async (filtros: Filtros) => {
    setLoadingSimples(true);
    try {
      let query = supabase
        .from('pedidos_simples')
        .select('*');

      // Aplicar filtros de usuário
      if (filtros.usuario === 'meus') {
        query = query.eq('user_id', user?.id);
      } else if (filtros.usuario && filtros.usuario !== 'todos') {
        query = query.eq('user_id', filtros.usuario);
      }

      // Aplicar outros filtros
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

      const { data: pedidos, error } = await query.order('criado_em', { ascending: false });

      if (error) throw error;

      // Buscar dados dos usuários
      const userIds = [...new Set(pedidos?.map(p => p.user_id).filter(id => id))];
      const usuariosMap = new Map();

      if (userIds.length > 0) {
        const { data: usuarios } = await supabase
          .from('usuarios')
          .select('id, nome, loja')
          .in('id', userIds);

        usuarios?.forEach(usuario => {
          usuariosMap.set(usuario.id, usuario);
        });
      }

      const pedidosComDetalhes = (pedidos || []).map(pedido => {
        const usuario = usuariosMap.get(pedido.user_id);
        
        return {
          ...pedido,
          usuario_nome: usuario?.nome || 'Não identificado',
          usuario_loja: usuario?.loja || '',
          tipo: 'simples' as const
        };
      });

      setPedidosSimples(pedidosComDetalhes);
    } catch (error) {
      console.error('Erro ao buscar pedidos simples:', error);
    } finally {
      setLoadingSimples(false);
    }
  };

  return {
    pedidosCotacao,
    pedidosSimples,
    compradores,
    loadingCotacao,
    loadingSimples,
    buscarPedidosCotacao,
    buscarPedidosSimples,
    isComprador,
    isMaster
  };
};