import { useState, useCallback, useMemo } from 'react';
import { PedidoConsolidado, EventoCalendario, MetricasConsolidadas, FiltrosHistorico } from './useHistoricoConsolidado';

interface UseHistoricoOtimizadoReturn {
  dadosFiltrados: PedidoConsolidado[];
  eventosCalendario: EventoCalendario[];
  metricas: MetricasConsolidadas;
  isFiltering: boolean;
  aplicarFiltros: (filtros: FiltrosHistorico, dados: PedidoConsolidado[]) => void;
  ordenarDados: (campo: keyof PedidoConsolidado, direcao: 'asc' | 'desc') => void;
  buscarTexto: (texto: string) => void;
}

export const useHistoricoOtimizado = (): UseHistoricoOtimizadoReturn => {
  const [dadosFiltrados, setDadosFiltrados] = useState<PedidoConsolidado[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [ordenacao, setOrdenacao] = useState<{ campo: keyof PedidoConsolidado; direcao: 'asc' | 'desc' }>({
    campo: 'data',
    direcao: 'desc'
  });
  const [textoBusca, setTextoBusca] = useState('');

  const aplicarFiltros = useCallback((filtros: FiltrosHistorico, dadosOriginais: PedidoConsolidado[]) => {
    setIsFiltering(true);
    
    // Usar setTimeout para não bloquear a UI
    setTimeout(() => {
      let resultado = [...dadosOriginais];

      // Aplicar filtros
      if (filtros.dataInicio) {
        resultado = resultado.filter(p => p.data >= filtros.dataInicio!);
      }
      
      if (filtros.dataFim) {
        resultado = resultado.filter(p => p.data <= filtros.dataFim!);
      }
      
      if (filtros.comprador) {
        resultado = resultado.filter(p => 
          p.comprador?.toLowerCase().includes(filtros.comprador!.toLowerCase())
        );
      }
      
      if (filtros.fornecedor) {
        resultado = resultado.filter(p => 
          p.fornecedor?.toLowerCase().includes(filtros.fornecedor!.toLowerCase())
        );
      }
      
      if (filtros.tipo) {
        resultado = resultado.filter(p => p.tipo === filtros.tipo);
      }
      
      if (filtros.valorMin !== undefined) {
        resultado = resultado.filter(p => p.valorTotal >= filtros.valorMin!);
      }
      
      if (filtros.valorMax !== undefined) {
        resultado = resultado.filter(p => p.valorTotal <= filtros.valorMax!);
      }

      // Aplicar busca por texto
      if (textoBusca) {
        const termosBusca = textoBusca.toLowerCase().split(' ');
        resultado = resultado.filter(p => {
          const textoCompleto = [
            p.comprador,
            p.fornecedor,
            p.tipo,
            p.status
          ].filter(Boolean).join(' ').toLowerCase();
          
          return termosBusca.every(termo => textoCompleto.includes(termo));
        });
      }

      // Aplicar ordenação
      resultado.sort((a, b) => {
        const valorA = a[ordenacao.campo];
        const valorB = b[ordenacao.campo];
        
        if (valorA === valorB) return 0;
        
        const comparacao = valorA < valorB ? -1 : 1;
        return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
      });

      setDadosFiltrados(resultado);
      setIsFiltering(false);
    }, 100);
  }, [ordenacao, textoBusca]);

  const ordenarDados = useCallback((campo: keyof PedidoConsolidado, direcao: 'asc' | 'desc') => {
    setOrdenacao({ campo, direcao });
    
    setDadosFiltrados(prev => {
      const ordenados = [...prev].sort((a, b) => {
        const valorA = a[campo];
        const valorB = b[campo];
        
        if (valorA === valorB) return 0;
        
        const comparacao = valorA < valorB ? -1 : 1;
        return direcao === 'asc' ? comparacao : -comparacao;
      });
      
      return ordenados;
    });
  }, []);

  const buscarTexto = useCallback((texto: string) => {
    setTextoBusca(texto);
  }, []);

  // Memoizar cálculos pesados
  const eventosCalendario = useMemo((): EventoCalendario[] => {
    const eventosMap = new Map<string, {
      pedidos: PedidoConsolidado[];
      totalValor: number;
      tipos: string[];
    }>();

    dadosFiltrados.forEach(pedido => {
      const dataKey = pedido.data.split('T')[0];
      const evento = eventosMap.get(dataKey) || {
        pedidos: [],
        totalValor: 0,
        totalItens: 0,
        tipos: [],
        fornecedores: []
      };

      evento.pedidos.push(pedido);
      evento.totalValor += pedido.valorTotal;
      evento.totalItens += pedido.totalItens;
      
      if (!evento.tipos.includes(pedido.tipo)) {
        evento.tipos.push(pedido.tipo);
      }

      if (pedido.fornecedor && !evento.fornecedores.includes(pedido.fornecedor)) {
        evento.fornecedores.push(pedido.fornecedor);
      }

      eventosMap.set(dataKey, evento);
    });

    return Array.from(eventosMap.entries()).map(([data, evento]) => ({
      id: data,
      title: `${evento.pedidos.length} pedidos`,
      start: new Date(data + 'T00:00:00'),
      end: new Date(data + 'T23:59:59'),
      resource: evento
    }));
  }, [dadosFiltrados]);

  const metricas = useMemo((): MetricasConsolidadas => {
    const totalPedidos = dadosFiltrados.length;
    const valorTotal = dadosFiltrados.reduce((sum, p) => sum + p.valorTotal, 0);
    const totalItens = dadosFiltrados.reduce((sum, p) => sum + p.totalItens, 0);

    const fornecedoresMap = new Map<string, { pedidos: number; valor: number }>();
    const compradoresMap = new Map<string, { pedidos: number; valor: number }>();
    const tiposMap = new Map<string, number>();

    dadosFiltrados.forEach(pedido => {
      // Fornecedores
      if (pedido.fornecedor) {
        const fornecedor = fornecedoresMap.get(pedido.fornecedor) || { pedidos: 0, valor: 0 };
        fornecedor.pedidos++;
        fornecedor.valor += pedido.valorTotal;
        fornecedoresMap.set(pedido.fornecedor, fornecedor);
      }

      // Compradores
      if (pedido.comprador) {
        const comprador = compradoresMap.get(pedido.comprador) || { pedidos: 0, valor: 0 };
        comprador.pedidos++;
        comprador.valor += pedido.valorTotal;
        compradoresMap.set(pedido.comprador, comprador);
      }

      // Tipos
      tiposMap.set(pedido.tipo, (tiposMap.get(pedido.tipo) || 0) + 1);
    });

    // Estatísticas de frequência
    const pedidosPorDia = new Map<string, number>();
    dadosFiltrados.forEach(pedido => {
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
        diasSemPedidos: 0 // Seria necessário um período definido para calcular
      }
    };
  }, [dadosFiltrados]);

  return {
    dadosFiltrados,
    eventosCalendario,
    metricas,
    isFiltering,
    aplicarFiltros,
    ordenarDados,
    buscarTexto
  };
};