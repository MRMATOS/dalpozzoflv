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
  itens?: ItemPedido[];
  // NOVO: Campos específicos para pedidos simples
  data_pedido?: string;
  data_prevista?: string; 
  data_recebimento?: string;
  status_entrega?: string;
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

  // CORREÇÃO CRÍTICA: Função otimizada para buscar itens com contagem precisa
  const buscarItensPedido = useCallback(async (pedidoId: string, tipoPedido: 'cotacao' | 'simples'): Promise<ItemPedido[]> => {
    try {
      console.log(`[CRITICAL DEBUG] Buscando itens para pedido ${pedidoId} do tipo ${tipoPedido}`);
      
      if (tipoPedido === 'cotacao') {
        // CORREÇÃO CRÍTICA: Query otimizada com LEFT JOIN para garantir todos os dados
        const { data: itens, error } = await supabase
          .from('itens_pedido')
          .select(`
            id,
            quantidade,
            preco,
            tipo,
            unidade,
            produto_id,
            produtos:produto_id (
              id,
              produto,
              nome_variacao,
              produto_pai_id
            )
          `)
          .eq('pedido_id', pedidoId);

        if (error) {
          console.error(`[CRITICAL ERROR] Erro na query de itens para ${pedidoId}:`, error);
          return [];
        }

        console.log(`[CRITICAL DEBUG] Query resultado para ${pedidoId}:`, itens);

        if (!itens || itens.length === 0) {
          console.warn(`[CRITICAL WARNING] Nenhum item encontrado para cotação ${pedidoId}`);
          return [];
        }

        const itensFormatados = itens.map(item => {
          const produto = item.produtos;
          let produto_nome = 'Produto não identificado';
          
          if (produto) {
            produto_nome = produto.nome_variacao 
              ? `${produto.produto} ${produto.nome_variacao}`
              : produto.produto || 'Produto não identificado';
          }

          return {
            id: item.id,
            produto_nome,
            quantidade: item.quantidade || 0,
            preco: item.preco,
            tipo: item.tipo,
            unidade: item.unidade
          };
        });

        console.log(`[CRITICAL SUCCESS] ${itensFormatados.length} itens formatados para cotação ${pedidoId}`);
        return itensFormatados;

      } else {
        // Para pedidos simples, buscar direto da tabela
        const { data: pedido, error } = await supabase
          .from('pedidos_simples')
          .select('id, produto_nome, quantidade, valor_unitario, unidade, tipo')
          .eq('id', pedidoId)
          .single();

        if (error) {
          console.error('[ERROR] Erro ao buscar pedido simples:', error);
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
      console.error('[CRITICAL ERROR] Erro geral ao buscar itens do pedido:', error);
      return [];
    }
  }, []);

  // CORREÇÃO: Função para carregar itens em lote para múltiplos pedidos
  const carregarItensParaPedidos = useCallback(async (pedidos: PedidoConsolidado[]): Promise<PedidoConsolidado[]> => {
    console.log(`[BATCH LOADING] Carregando itens para ${pedidos.length} pedidos`);
    
    const pedidosComItens = await Promise.all(
      pedidos.map(async (pedido) => {
        const itens = await buscarItensPedido(pedido.id, pedido.tipo);
        return { 
          ...pedido, 
          itens,
          totalItens: itens.length // CORREÇÃO: Usar contagem real dos itens carregados
        };
      })
    );

    console.log(`[BATCH SUCCESS] Itens carregados para todos os pedidos`);
    return pedidosComItens;
  }, [buscarItensPedido]);

  // Nova função para buscar pedidos de um dia específico
  const buscarPedidosDoDia = useCallback(async (data: string): Promise<PedidoConsolidado[]> => {
    try {
      console.log(`[DAY SEARCH] Buscando pedidos do dia: ${data}`);
      
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
      console.log(`[DAY SUCCESS] Total de pedidos encontrados para ${data}:`, todosPedidosDoDia.length);
      
      return todosPedidosDoDia.sort((a, b) => 
        new Date(a.data).getTime() - new Date(b.data).getTime()
      );
    } catch (error) {
      console.error('[DAY ERROR] Erro ao buscar pedidos do dia:', error);
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

  // CORREÇÃO CRÍTICA: Função melhorada para buscar pedidos de um dia específico com itens
  const buscarPedidosDoDiaComItens = useCallback(async (data: string): Promise<PedidoConsolidado[]> => {
    console.log(`[WITH ITEMS] Buscando pedidos com itens para o dia: ${data}`);
    const pedidos = await buscarPedidosDoDia(data);
    
    // Usar função de carregamento em lote para melhor performance
    const pedidosComItens = await carregarItensParaPedidos(pedidos);
    
    console.log(`[WITH ITEMS SUCCESS] Total de pedidos com itens carregados:`, pedidosComItens.length);
    return pedidosComItens;
  }, [buscarPedidosDoDia, carregarItensParaPedidos]);

  const buscarDadosConsolidados = useCallback(async (filtros: FiltrosHistorico) => {
    setLoading(true);
    try {
      console.log('[CONSOLIDATED] Buscando dados consolidados com filtros:', filtros);
      
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
      console.log(`[CONSOLIDATED] Total de pedidos consolidados: ${todosOsPedidos.length}`);
      setPedidosConsolidados(todosOsPedidos);

      // Gerar eventos do calendário
      const eventos = gerarEventosCalendario(todosOsPedidos);
      setEventosCalendario(eventos);

      // Calcular métricas
      const metricasCalculadas = calcularMetricas(todosOsPedidos);
      setMetricas(metricasCalculadas);

    } catch (error) {
      console.error('[CONSOLIDATED ERROR] Erro ao buscar dados consolidados:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // CORREÇÃO CRÍTICA: Melhorar busca de pedidos de cotação com fonte de dados correta
  const buscarPedidosCotacao = async (filtros: FiltrosHistorico): Promise<PedidoConsolidado[]> => {
    let query = supabase
      .from('cotacoes')
      .select(`
        id,
        data,
        user_id,
        fornecedores!inner(nome),
        pedidos_compra!inner(
          id,
          total
        )
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
      query = query.gte('data', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data', filtros.dataFim + 'T23:59:59');
    }

    const { data: cotacoes, error } = await query.order('data', { ascending: false });

    if (error) throw error;

    // CORREÇÃO CRÍTICA: Contar itens reais com query otimizada
    const pedidosComDetalhes = await Promise.all(
      (cotacoes || []).map(async (cotacao: any) => {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('nome, loja')
          .eq('id', cotacao.user_id)
          .single();

        // CORREÇÃO CRÍTICA: Contar itens reais com query mais robusta
        const { count: totalItensReal } = await supabase
          .from('itens_pedido')
          .select('*', { count: 'exact', head: true })
          .eq('pedido_id', cotacao.pedidos_compra?.id);

        console.log(`[COTACAO COUNT] Cotação ${cotacao.id} tem ${totalItensReal || 0} itens reais`);

        return {
          id: cotacao.pedidos_compra?.id || cotacao.id,
          data: cotacao.data, // CORREÇÃO: Usar cotacoes.data diretamente
          tipo: 'cotacao' as const,
          fornecedor: cotacao.fornecedores?.nome || 'Não informado',
          comprador: usuario?.nome || 'Não identificado',
          usuario_loja: usuario?.loja || '',
          valorTotal: cotacao.pedidos_compra?.total || 0,
          totalItens: totalItensReal || 0 // CORREÇÃO: Usar contagem real robusta
        };
      })
    );

    console.log(`[COTACAO SUCCESS] Pedidos de cotação encontrados: ${pedidosComDetalhes.length}`);
    return pedidosComDetalhes;
  };

  // CORREÇÃO CRÍTICA: Atualizar busca de pedidos simples para incluir novos campos
  const buscarPedidosSimples = async (filtros: FiltrosHistorico): Promise<PedidoConsolidado[]> => {
    let query = supabase
      .from('pedidos_simples')
      .select('id, data_pedido, data_prevista, data_recebimento, status_entrega, produto_nome, fornecedor_nome, quantidade, valor_unitario, valor_total_estimado, unidade, tipo, observacoes, user_id, fornecedor_id, produto_id');

    // Aplicar filtros
    if (filtros.comprador === 'meus') {
      query = query.eq('user_id', user?.id);
    } else if (filtros.comprador && filtros.comprador !== 'todos') {
      query = query.eq('user_id', filtros.comprador);
    }

    if (filtros.fornecedor) {
      query = query.ilike('fornecedor_nome', `%${filtros.fornecedor}%`);
    }
    
    // CORREÇÃO: Usar data_prevista para filtros de data (não data_pedido)
    if (filtros.dataInicio) {
      query = query.gte('data_prevista', filtros.dataInicio);
    }
    if (filtros.dataFim) {
      query = query.lte('data_prevista', filtros.dataFim);
    }

    const { data: pedidos, error } = await query.order('data_prevista', { ascending: false });

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
      
      // CORREÇÃO CRÍTICA: Usar data_prevista como data principal para ordenação
      const dataFormatada = `${pedido.data_prevista || pedido.data_pedido}T12:00:00`;
      
      return {
        id: pedido.id,
        data: dataFormatada, // Data principal para ordenação (data_prevista)
        tipo: 'simples' as const,
        fornecedor: pedido.fornecedor_nome,
        comprador: usuario?.nome || 'Não identificado',
        usuario_loja: usuario?.loja || '',
        valorTotal: pedido.valor_total_estimado || 0,
        totalItens: 1,
        observacoes: pedido.observacoes,
        // NOVO: Campos específicos para pedidos simples
        data_pedido: pedido.data_pedido,
        data_prevista: pedido.data_prevista,
        data_recebimento: pedido.data_recebimento,
        status_entrega: pedido.status_entrega || 'pendente'
      };
    });

    console.log(`[SIMPLES SUCCESS] Pedidos simples encontrados: ${pedidosComDetalhes.length}`);
    return pedidosComDetalhes;
  };

  // CORREÇÃO CRÍTICA: Geração de eventos com datas consistentes
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
      const dataCompleta = new Date(pedido.data);
      
      // CORREÇÃO CRÍTICA: Extrair apenas a parte da data sem conversões de timezone
      const dataKey = pedido.data.split('T')[0]; // YYYY-MM-DD direto da string

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

    // Gerar eventos consolidados
    const eventos: EventoCalendario[] = [];
    
    eventosPorDia.forEach((dadosDia, dataKey) => {
      const fornecedoresList = Array.from(dadosDia.fornecedores);
      
      // Título mais limpo - apenas fornecedores principais
      let titulo = '';
      if (fornecedoresList.length <= 2) {
        titulo = fornecedoresList.join(', ');
      } else {
        titulo = `${fornecedoresList.slice(0, 2).join(', ')} +${fornecedoresList.length - 2}`;
      }

      // CORREÇÃO CRÍTICA: Criar data sem conversões desnecessárias
      const [ano, mes, dia] = dataKey.split('-').map(Number);
      const startDate = new Date(ano, mes - 1, dia, 12, 0, 0); // Meio-dia para evitar problemas de timezone
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const evento: EventoCalendario = {
        id: `consolidated-${dataKey}`,
        title: titulo,
        start: startDate,
        end: endDate,
        resource: {
          pedidos: dadosDia.pedidos,
          totalValor: dadosDia.totalValor,
          totalItens: dadosDia.totalItens,
          tipos: Array.from(dadosDia.tipos),
          fornecedores: fornecedoresList,
          dataCompleta: dataKey // CORREÇÃO: dataCompleta sempre YYYY-MM-DD
        }
      };

      eventos.push(evento);
    });

    console.log(`[EVENTOS GERADOS] Total de eventos: ${eventos.length}`);
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
    carregarItensParaPedidos,
    isComprador,
    isMaster
  };
};
