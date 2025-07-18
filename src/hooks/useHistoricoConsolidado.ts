import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ItemPedido {
  id: string;
  produto_nome: string;
  quantidade: number;
  preco?: number;
  tipo?: string;
  unidade?: string;
}

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
  itens?: ItemPedido[]; // Opcional, carregado sob demanda
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
    dataCompleta: string;
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

  // CORREÇÃO CRÍTICA: Função melhorada para buscar itens de um pedido específico
  const buscarItensPedido = useCallback(async (pedidoId: string, tipoPedido: 'cotacao' | 'simples'): Promise<ItemPedido[]> => {
    try {
      console.log(`[DEBUG] Buscando itens para pedido ${pedidoId} do tipo ${tipoPedido}`);
      
      if (tipoPedido === 'cotacao') {
        // CORREÇÃO: Query melhorada para cotações
        const { data: itens, error } = await supabase
          .from('itens_pedido')
          .select(`
            id,
            quantidade,
            preco,
            tipo,
            unidade,
            produto_id,
            produtos!inner(
              id,
              produto,
              nome_variacao,
              produto_pai_id
            )
          `)
          .eq('pedido_id', pedidoId);

        if (error) {
          console.error(`[ERROR] Erro ao buscar itens de cotação para ${pedidoId}:`, error);
          return [];
        }

        console.log(`[DEBUG] Encontrados ${itens?.length || 0} itens para cotação ${pedidoId}:`, itens);

        if (!itens || itens.length === 0) {
          console.warn(`[WARNING] Nenhum item encontrado para cotação ${pedidoId}`);
          return [];
        }

        return itens.map(item => ({
          id: item.id,
          produto_nome: item.produtos?.nome_variacao 
            ? `${item.produtos.produto} ${item.produtos.nome_variacao}`
            : item.produtos?.produto || 'Produto não identificado',
          quantidade: item.quantidade || 0,
          preco: item.preco,
          tipo: item.tipo,
          unidade: item.unidade
        }));

      } else {
        // Para pedidos simples, buscar direto da tabela
        const { data: pedido, error } = await supabase
          .from('pedidos_simples')
          .select('id, produto_nome, quantidade, valor_unitario, unidade, tipo')
          .eq('id', pedidoId)
          .single();

        if (error) {
          console.error('Erro ao buscar pedido simples:', error);
          return [];
        }

        return [{
          id: pedido.id,
          produto_nome: pedido.produto_nome,
          quantidade: pedido.quantidade,
          preco: pedido.valor_unitario,
          unidade: pedido.unidade,
          tipo: pedido.tipo
        }];
      }
    } catch (error) {
      console.error('Erro ao buscar itens do pedido:', error);
      return [];
    }
  }, []);

  // Nova função para buscar pedidos de um dia específico
  const buscarPedidosDoDia = useCallback(async (data: string): Promise<PedidoConsolidado[]> => {
    try {
      console.log(`Buscando pedidos do dia: ${data}`);
      
      // Buscar pedidos de cotação do dia
      const pedidosCotacao = await buscarPedidosCotacao({
        dataInicio: data,
        dataFim: data
      });

      // Buscar pedidos simples do dia
      const pedidosSimples = await buscarPedidosSimples({
        dataInicio: data,
        dataFim: data
      });

      // Combinar e ordenar por horário
      const todosPedidosDoDia = [...pedidosCotacao, ...pedidosSimples];
      console.log(`Total de pedidos encontrados para ${data}:`, todosPedidosDoDia.length);
      
      return todosPedidosDoDia.sort((a, b) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );
    } catch (error) {
      console.error('Erro ao buscar pedidos do dia:', error);
      return [];
    }
  }, [user?.id]);

  // NOVA FUNÇÃO: Buscar pedidos dos dias adjacentes
  const buscarPedidosDiaAdjacente = useCallback(async (dataAtual: string, direcao: 'anterior' | 'proximo'): Promise<{
    data: string;
    pedidos: PedidoConsolidado[];
  } | null> => {
    try {
      const dataBase = new Date(dataAtual);
      const novaData = new Date(dataBase);
      
      if (direcao === 'anterior') {
        novaData.setDate(dataBase.getDate() - 1);
      } else {
        novaData.setDate(dataBase.getDate() + 1);
      }
      
      const novaDataStr = novaData.toISOString().split('T')[0];
      const pedidos = await buscarPedidosDoDiaComItens(novaDataStr);
      
      if (pedidos.length === 0) {
        return null; // Não há pedidos neste dia
      }
      
      return {
        data: novaDataStr,
        pedidos
      };
    } catch (error) {
      console.error('Erro ao buscar dia adjacente:', error);
      return null;
    }
  }, []);

  // Nova função para buscar todos os produtos de um dia específico
  const buscarProdutosDoDia = useCallback(async (data: string): Promise<Array<{
    produto_nome: string;
    quantidade_total: number;
    pedidos_count: number;
    fornecedores: string[];
    preco_medio?: number;
    unidade?: string;
    tipos?: string[];
  }>> => {
    try {
      console.log(`Buscando produtos do dia: ${data}`);
      const pedidosDoDia = await buscarPedidosDoDia(data);
      
      // Buscar itens para todos os pedidos do dia
      const todosProdutos = new Map();

      for (const pedido of pedidosDoDia) {
        const itens = await buscarItensPedido(pedido.id, pedido.tipo);
        
        itens.forEach(item => {
          const key = item.produto_nome;
          const existing = todosProdutos.get(key) || {
            produto_nome: item.produto_nome,
            quantidade_total: 0,
            pedidos_count: 0,
            fornecedores: new Set<string>(),
            precos: [],
            unidade: item.unidade,
            tipos: new Set<string>()
          };

          existing.quantidade_total += item.quantidade;
          existing.pedidos_count += 1;
          existing.fornecedores.add(pedido.fornecedor);
          existing.tipos.add(pedido.tipo);
          if (item.preco) existing.precos.push(item.preco);
          
          todosProdutos.set(key, existing);
        });
      }

      // Converter para array e calcular preço médio
      const resultado = Array.from(todosProdutos.values()).map(produto => ({
        produto_nome: produto.produto_nome,
        quantidade_total: produto.quantidade_total,
        pedidos_count: produto.pedidos_count,
        fornecedores: Array.from(produto.fornecedores) as string[],
        preco_medio: produto.precos.length > 0 
          ? produto.precos.reduce((a: number, b: number) => a + b, 0) / produto.precos.length
          : undefined,
        unidade: produto.unidade,
        tipos: Array.from(produto.tipos) as string[]
      })).sort((a, b) => b.quantidade_total - a.quantidade_total);

      console.log(`Produtos do dia ${data}:`, resultado);
      return resultado;

    } catch (error) {
      console.error('Erro ao buscar produtos do dia:', error);
      return [];
    }
  }, [buscarItensPedido, buscarPedidosDoDia]);

  // CORREÇÃO: Função melhorada para buscar pedidos de um dia específico com itens
  const buscarPedidosDoDiaComItens = useCallback(async (data: string): Promise<PedidoConsolidado[]> => {
    console.log(`Buscando pedidos com itens para o dia: ${data}`);
    const pedidos = await buscarPedidosDoDia(data);
    
    // Buscar itens para cada pedido e atualizar totalItens
    const pedidosComItens = await Promise.all(
      pedidos.map(async (pedido) => {
        const itens = await buscarItensPedido(pedido.id, pedido.tipo);
        console.log(`Pedido ${pedido.id} (${pedido.tipo}) tem ${itens.length} itens`);
        
        return { 
          ...pedido, 
          itens,
          totalItens: itens.length // CORREÇÃO: Usar número real de itens
        };
      })
    );

    console.log(`Total de pedidos com itens carregados:`, pedidosComItens.length);
    return pedidosComItens;
  }, [buscarPedidosDoDia, buscarItensPedido]);

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
      console.log(`Total de pedidos consolidados: ${todosOsPedidos.length}`);
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

  // CORREÇÃO: Melhorar busca de pedidos de cotação
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
      query = query.eq('fornecedores.nome', filtros.fornecedor);
    }
    if (filtros.dataInicio) {
      query = query.gte('criado_em', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('criado_em', filtros.dataFim + 'T23:59:59');
    }

    const { data: pedidos, error } = await query.order('criado_em', { ascending: false });

    if (error) throw error;

    // CORREÇÃO: Buscar dados dos usuários e contagem REAL de itens
    const pedidosComDetalhes = await Promise.all(
      (pedidos || []).map(async (pedido: any) => {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('nome, loja')
          .eq('id', pedido.user_id)
          .single();

        // CORREÇÃO CRÍTICA: Contar itens reais do pedido
        const { data: itens } = await supabase
          .from('itens_pedido')
          .select('id')
          .eq('pedido_id', pedido.id);

        const totalItensReal = itens?.length || 0;
        console.log(`[DEBUG] Pedido cotação ${pedido.id} tem ${totalItensReal} itens`);

        // CORREÇÃO: Garantir horário correto (manter timezone original)
        const dataOriginal = new Date(pedido.criado_em);
        
        return {
          id: pedido.id,
          data: pedido.criado_em, // Manter formato ISO original
          tipo: 'cotacao' as const,
          fornecedor: pedido.fornecedores?.nome || 'Não informado',
          comprador: usuario?.nome || 'Não identificado',
          usuario_loja: usuario?.loja || '',
          valorTotal: pedido.total || 0,
          totalItens: totalItensReal // CORREÇÃO: Usar contagem real
        };
      })
    );

    console.log(`[DEBUG] Pedidos de cotação encontrados: ${pedidosComDetalhes.length}`);
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
    // Consolidar pedidos por dia
    const eventosPorDia = new Map<string, {
      pedidos: PedidoConsolidado[];
      fornecedores: Set<string>;
      tipos: Set<string>;
      totalValor: number;
      totalItens: number;
      primeiroHorario: Date;
    }>();

    // Agrupar pedidos por dia
    pedidos.forEach(pedido => {
      const dataKey = pedido.data.split('T')[0];
      // CORREÇÃO: Preservar horário original para auto-scroll
      const dataCompleta = new Date(pedido.data);

      const existing = eventosPorDia.get(dataKey) || {
        pedidos: [],
        fornecedores: new Set<string>(),
        tipos: new Set<string>(),
        totalValor: 0,
        totalItens: 0,
        primeiroHorario: dataCompleta
      };

      existing.pedidos.push(pedido);
      existing.fornecedores.add(pedido.fornecedor);
      existing.tipos.add(pedido.tipo);
      existing.totalValor += pedido.valorTotal;
      existing.totalItens += pedido.totalItens;
      
      // Manter o primeiro horário do dia
      if (dataCompleta.getTime() < existing.primeiroHorario.getTime()) {
        existing.primeiroHorario = dataCompleta;
      }

      eventosPorDia.set(dataKey, existing);
    });

    // Gerar eventos consolidados - CORREÇÃO: Formatação limpa
    const eventos: EventoCalendario[] = [];
    
    eventosPorDia.forEach((dadosDia, dataKey) => {
      const fornecedoresList = Array.from(dadosDia.fornecedores);
      
      // CORREÇÃO: Título limpo apenas com fornecedores
      let titulo = '';
      if (fornecedoresList.length <= 2) {
        titulo = fornecedoresList.join(', ');
      } else if (fornecedoresList.length === 3) {
        titulo = fornecedoresList.slice(0, 2).join(', ') + ' e mais 1';
      } else {
        titulo = fornecedoresList.slice(0, 2).join(', ') + ` e mais ${fornecedoresList.length - 2}`;
      }

      const evento: EventoCalendario = {
        id: `consolidated-${dataKey}`,
        title: titulo,
        start: dadosDia.primeiroHorario,
        end: new Date(dadosDia.primeiroHorario.getTime() + 60 * 60 * 1000),
        resource: {
          pedidos: dadosDia.pedidos,
          totalValor: dadosDia.totalValor,
          totalItens: dadosDia.totalItens,
          tipos: Array.from(dadosDia.tipos),
          fornecedores: fornecedoresList,
          dataCompleta: dataKey
        }
      };

      eventos.push(evento);
    });

    return eventos.sort((a, b) => a.start.getTime() - b.start.getTime());
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
    buscarPedidosDoDia,
    buscarItensPedido,
    buscarProdutosDoDia,
    buscarPedidosDoDiaComItens,
    buscarPedidosDiaAdjacente,
    isComprador,
    isMaster
  };
};
