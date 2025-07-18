
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PedidoConsolidado {
  id: string;
  data: Date;
  tipo: 'cotacao' | 'simples';
  fornecedor_nome: string;
  usuario_nome: string;
  usuario_loja: string;
  total: number;
  quantidade_itens: number;
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
  totalValor: number;
  totalItens: number;
  produtosMaisComprados: Array<{ nome: string; quantidade: number }>;
  fornecedoresMaisAcionados: Array<{ nome: string; pedidos: number; valor: number }>;
  compradorEstatisticas: Array<{ nome: string; pedidos: number; valor: number }>;
  frequenciaPorDia: Array<{ data: string; pedidos: number }>;
}

export interface FiltrosHistorico {
  dataInicio: string;
  dataFim: string;
  comprador: string;
  fornecedor: string;
  produto: string;
  tipoPedido: 'todos' | 'cotacao' | 'simples';
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

  const buscarDadosConsolidados = async (filtros: FiltrosHistorico) => {
    setLoading(true);
    try {
      console.log('Buscando dados consolidados com filtros:', filtros);
      
      // Buscar pedidos de cotação
      let pedidosCotacao: PedidoConsolidado[] = [];
      if (filtros.tipoPedido === 'todos' || filtros.tipoPedido === 'cotacao') {
        pedidosCotacao = await buscarPedidosCotacao(filtros);
      }

      // Buscar pedidos simples
      let pedidosSimples: PedidoConsolidado[] = [];
      if (filtros.tipoPedido === 'todos' || filtros.tipoPedido === 'simples') {
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
  };

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
          data: new Date(pedido.criado_em),
          tipo: 'cotacao' as const,
          fornecedor_nome: pedido.fornecedores?.nome || 'Não informado',
          usuario_nome: usuario?.nome || 'Não identificado',
          usuario_loja: usuario?.loja || '',
          total: pedido.total || 0,
          quantidade_itens: itens?.length || 0
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
        id: pedido.id,
        data: new Date(pedido.data_pedido),
        tipo: 'simples' as const,
        fornecedor_nome: pedido.fornecedor_nome,
        usuario_nome: usuario?.nome || 'Não identificado',
        usuario_loja: usuario?.loja || '',
        total: pedido.valor_total_estimado || 0,
        quantidade_itens: 1, // Pedidos simples têm 1 item
        observacoes: pedido.observacoes
      };
    });

    return pedidosComDetalhes;
  };

  const gerarEventosCalendario = (pedidos: PedidoConsolidado[]): EventoCalendario[] => {
    const eventosPorDia = new Map<string, PedidoConsolidado[]>();

    // Agrupar pedidos por dia
    pedidos.forEach(pedido => {
      const dataKey = pedido.data.toISOString().split('T')[0];
      if (!eventosPorDia.has(dataKey)) {
        eventosPorDia.set(dataKey, []);
      }
      eventosPorDia.get(dataKey)!.push(pedido);
    });

    // Converter para eventos do calendário
    const eventos: EventoCalendario[] = [];
    
    eventosPorDia.forEach((pedidosDoDia, dataKey) => {
      const data = new Date(dataKey + 'T12:00:00');
      const totalValor = pedidosDoDia.reduce((sum, p) => sum + p.total, 0);
      const totalItens = pedidosDoDia.reduce((sum, p) => sum + p.quantidade_itens, 0);
      const tipos = [...new Set(pedidosDoDia.map(p => p.tipo))];
      const fornecedores = [...new Set(pedidosDoDia.map(p => p.fornecedor_nome))];

      eventos.push({
        id: dataKey,
        title: `${pedidosDoDia.length} pedidos - R$ ${totalValor.toFixed(2)}`,
        start: data,
        end: data,
        resource: {
          pedidos: pedidosDoDia,
          totalValor,
          totalItens,
          tipos,
          fornecedores
        }
      });
    });

    return eventos;
  };

  const calcularMetricas = (pedidos: PedidoConsolidado[]): MetricasConsolidadas => {
    const totalPedidos = pedidos.length;
    const totalValor = pedidos.reduce((sum, p) => sum + p.total, 0);
    const totalItens = pedidos.reduce((sum, p) => sum + p.quantidade_itens, 0);

    // Fornecedores mais acionados
    const fornecedoresMap = new Map<string, { pedidos: number; valor: number }>();
    pedidos.forEach(pedido => {
      const current = fornecedoresMap.get(pedido.fornecedor_nome) || { pedidos: 0, valor: 0 };
      fornecedoresMap.set(pedido.fornecedor_nome, {
        pedidos: current.pedidos + 1,
        valor: current.valor + pedido.total
      });
    });

    const fornecedoresMaisAcionados = Array.from(fornecedoresMap.entries())
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.pedidos - a.pedidos)
      .slice(0, 10);

    // Estatísticas por comprador
    const compradoresMap = new Map<string, { pedidos: number; valor: number }>();
    pedidos.forEach(pedido => {
      const current = compradoresMap.get(pedido.usuario_nome) || { pedidos: 0, valor: 0 };
      compradoresMap.set(pedido.usuario_nome, {
        pedidos: current.pedidos + 1,
        valor: current.valor + pedido.total
      });
    });

    const compradorEstatisticas = Array.from(compradoresMap.entries())
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.valor - a.valor);

    // Frequência por dia
    const frequenciaMap = new Map<string, number>();
    pedidos.forEach(pedido => {
      const dataKey = pedido.data.toISOString().split('T')[0];
      frequenciaMap.set(dataKey, (frequenciaMap.get(dataKey) || 0) + 1);
    });

    const frequenciaPorDia = Array.from(frequenciaMap.entries())
      .map(([data, pedidos]) => ({ data, pedidos }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return {
      totalPedidos,
      totalValor,
      totalItens,
      produtosMaisComprados: [], // TODO: Implementar após ter dados de produtos
      fornecedoresMaisAcionados,
      compradorEstatisticas,
      frequenciaPorDia
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
