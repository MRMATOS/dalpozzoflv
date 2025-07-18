import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoConsolidado {
  id: string;
  data: string;
  tipo: 'cotacao' | 'simples';
  fornecedor: string;
  comprador: string;
  usuario_loja: string;
  valorTotal: number;
  totalItens: number;
  status?: string;
  observacoes?: string;
}

export interface EventoCalendario {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    pedidos: PedidoConsolidado[];
    totalValor: number;
    totalItens: number;
    tipos: string[];
    fornecedores: string[];
  };
}

export interface MetricasConsolidadas {
  totalPedidos: number;
  valorTotal: number;
  totalItens: number;
  valorMedio: number;
  fornecedoresUnicos: number;
  compradoresUnicos: number;
  topFornecedores: Array<{ nome: string; pedidos: number; valor: number }>;
  topCompradores: Array<{ nome: string; pedidos: number; valor: number }>;
  distribuicaoTipos: Array<{ tipo: string; quantidade: number; percentual: number }>;
  estatisticasFrequencia: {
    diasComPedidos: number;
    mediaPedidosPorDia: number;
    diasSemPedidos: number;
  };
}

export interface FiltrosHistorico {
  dataInicio?: string;
  dataFim?: string;
  comprador?: string;
  fornecedor?: string;
  tipo?: 'cotacao' | 'simples';
  valorMin?: number;
  valorMax?: number;
}

export const useHistoricoConsolidado = () => {
  const { user, profile } = useAuth();
  const [pedidosConsolidados, setPedidosConsolidados] = useState<PedidoConsolidado[]>([]);
  const [eventosCalendario, setEventosCalendario] = useState<EventoCalendario[]>([]);
  const [metricas, setMetricas] = useState<MetricasConsolidadas | null>(null);
  const [compradores, setCompradores] = useState<Array<{ id: string; nome: string; loja: string }>>([]);
  const [loading, setLoading] = useState(false);
  
  const isComprador = profile?.tipo === 'comprador';
  const isMaster = profile?.tipo === 'master';

  // Buscar lista de compradores
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

  const buscarDadosConsolidados = useCallback(async (filtros: FiltrosHistorico) => {
    setLoading(true);
    try {
      console.log('Buscando dados consolidados com filtros:', filtros);
      
      // Buscar pedidos de cotação
      let pedidosCotacao: PedidoConsolidado[] = [];
      if (!filtros.tipo || filtros.tipo === 'cotacao') {
        pedidosCotacao = await buscarPedidosCotacao(filtros);
      }

      // Buscar pedidos simples
      let pedidosSimples: PedidoConsolidado[] = [];
      if (!filtros.tipo || filtros.tipo === 'simples') {
        pedidosSimples = await buscarPedidosSimples(filtros);
      }

      // Consolidar todos os pedidos
      const todosOsPedidos = [...pedidosCotacao, ...pedidosSimples];
      setPedidosConsolidados(todosOsPedidos);

      // Gerar eventos do calendário
      const eventos = gerarEventosCalendario(todosOsPedidos);
      setEventosCalendario(eventos);

      // Calcular métricas
      const metricasCalculadas = calcularMetricas(todosOsPedidos);
      setMetricas(metricasCalculadas);

    } catch (error) {
      console.error('Erro ao buscar dados consolidados:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const buscarPedidosCotacao = async (filtros: FiltrosHistorico): Promise<PedidoConsolidado[]> => {
    let query = supabase
      .from('pedidos_compra')
      .select(`
        id,
        criado_em,
        total,
        user_id,
        fornecedores!inner(nome)
      `);

    // Aplicar filtros
    if (filtros.comprador === 'meus') {
      query = query.eq('user_id', user?.id);
    } else if (filtros.comprador && filtros.comprador !== 'todos') {
      query = query.eq('user_id', filtros.comprador);
    }

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
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('nome, loja')
          .eq('id', pedido.user_id)
          .single();

        const { data: itens } = await supabase
          .from('itens_pedido')
          .select('id')
          .eq('pedido_id', pedido.id);

        return {
          id: pedido.id,
          data: pedido.criado_em,
          tipo: 'cotacao' as const,
          fornecedor: pedido.fornecedores?.nome || 'Não informado',
          comprador: usuario?.nome || 'Não identificado',
          usuario_loja: usuario?.loja || '',
          valorTotal: pedido.total || 0,
          totalItens: itens?.length || 0
        };
      })
    );

    return pedidosComDetalhes;
  };

  const buscarPedidosSimples = async (filtros: FiltrosHistorico): Promise<PedidoConsolidado[]> => {
    let query = supabase
      .from('pedidos_simples')
      .select('*');

    // Aplicar filtros
    if (filtros.comprador === 'meus') {
      query = query.eq('user_id', user?.id);
    } else if (filtros.comprador && filtros.comprador !== 'todos') {
      query = query.eq('user_id', filtros.comprador);
    }

    if (filtros.fornecedor) {
      query = query.ilike('fornecedor_nome', `%${filtros.fornecedor}%`);
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
        id: pedido.id,
        data: pedido.data_pedido,
        tipo: 'simples' as const,
        fornecedor: pedido.fornecedor_nome,
        comprador: usuario?.nome || 'Não identificado',
        usuario_loja: usuario?.loja || '',
        valorTotal: pedido.valor_total_estimado || 0,
        totalItens: 1, // Pedidos simples têm 1 item
        observacoes: pedido.observacoes
      };
    });

    return pedidosComDetalhes;
  };

  const gerarEventosCalendario = (pedidos: PedidoConsolidado[]): EventoCalendario[] => {
    const eventos: EventoCalendario[] = [];
    
    pedidos.forEach((pedido, index) => {
      // Usar o horário real do pedido
      const dataCompleta = new Date(pedido.data);
      
      // Se a data for inválida, usar meio-dia como fallback
      if (isNaN(dataCompleta.getTime())) {
        const dataKey = pedido.data.split('T')[0];
        dataCompleta.setTime(new Date(dataKey + 'T12:00:00').getTime());
      }

      const evento: EventoCalendario = {
        id: `${pedido.id}-${index}`,
        title: `${pedido.fornecedor} - R$ ${pedido.valorTotal.toFixed(2)}`,
        start: dataCompleta,
        end: new Date(dataCompleta.getTime() + 60 * 60 * 1000), // Duração de 1 hora
        resource: {
          pedidos: [pedido],
          totalValor: pedido.valorTotal,
          totalItens: pedido.totalItens,
          tipos: [pedido.tipo],
          fornecedores: [pedido.fornecedor]
        }
      };

      eventos.push(evento);
    });

    return eventos;
  };

  const calcularMetricas = (pedidos: PedidoConsolidado[]): MetricasConsolidadas => {
    const totalPedidos = pedidos.length;
    const valorTotal = pedidos.reduce((sum, p) => sum + p.valorTotal, 0);
    const totalItens = pedidos.reduce((sum, p) => sum + p.totalItens, 0);

    const fornecedoresMap = new Map<string, { pedidos: number; valor: number }>();
    const compradoresMap = new Map<string, { pedidos: number; valor: number }>();
    const tiposMap = new Map<string, number>();

    pedidos.forEach(pedido => {
      // Fornecedores
      if (pedido.fornecedor) {
        const current = fornecedoresMap.get(pedido.fornecedor) || { pedidos: 0, valor: 0 };
        fornecedoresMap.set(pedido.fornecedor, {
          pedidos: current.pedidos + 1,
          valor: current.valor + pedido.valorTotal
        });
      }

      // Compradores
      if (pedido.comprador) {
        const current = compradoresMap.get(pedido.comprador) || { pedidos: 0, valor: 0 };
        compradoresMap.set(pedido.comprador, {
          pedidos: current.pedidos + 1,
          valor: current.valor + pedido.valorTotal
        });
      }

      // Tipos
      tiposMap.set(pedido.tipo, (tiposMap.get(pedido.tipo) || 0) + 1);
    });

    // Estatísticas de frequência
    const pedidosPorDia = new Map<string, number>();
    pedidos.forEach(pedido => {
      const dia = pedido.data.split('T')[0];
      pedidosPorDia.set(dia, (pedidosPorDia.get(dia) || 0) + 1);
    });

    const diasComPedidos = pedidosPorDia.size;
    const mediaPedidosPorDia = diasComPedidos > 0 ? totalPedidos / diasComPedidos : 0;

    return {
      totalPedidos,
      valorTotal,
      totalItens,
      valorMedio: totalPedidos > 0 ? valorTotal / totalPedidos : 0,
      fornecedoresUnicos: fornecedoresMap.size,
      compradoresUnicos: compradoresMap.size,
      topFornecedores: Array.from(fornecedoresMap.entries())
        .sort((a, b) => b[1].valor - a[1].valor)
        .slice(0, 5)
        .map(([nome, dados]) => ({ nome, ...dados })),
      topCompradores: Array.from(compradoresMap.entries())
        .sort((a, b) => b[1].valor - a[1].valor)
        .slice(0, 5)
        .map(([nome, dados]) => ({ nome, ...dados })),
      distribuicaoTipos: Array.from(tiposMap.entries()).map(([tipo, quantidade]) => ({
        tipo,
        quantidade,
        percentual: totalPedidos > 0 ? (quantidade / totalPedidos) * 100 : 0
      })),
      estatisticasFrequencia: {
        diasComPedidos,
        mediaPedidosPorDia,
        diasSemPedidos: 0
      }
    };
  };

  return {
    pedidosConsolidados,
    eventosCalendario,
    metricas,
    compradores,
    loading,
    buscarDadosConsolidados,
    isComprador,
    isMaster
  };
};
