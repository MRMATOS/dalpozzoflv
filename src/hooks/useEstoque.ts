
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLojas } from './useLojas';

interface EstoqueProduto {
  produto_id: string;
  produto_nome: string;
  nome_variacao?: string;
  produto_pai_id?: string;
  unidade: string;
  media_por_caixa: number;
  estoques_por_loja: { [loja: string]: number };
  total_estoque: number;
  total_kg: number;
}

export const useEstoque = () => {
  const [estoqueProdutos, setEstoqueProdutos] = useState<EstoqueProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { lojas } = useLojas();

  useEffect(() => {
    const fetchEstoque = async () => {
      try {
        setIsLoading(true);
        console.log('Buscando dados de estoque...');
        
        const { data, error } = await supabase
          .from('estoque_atual')
          .select(`
            produto_id,
            loja,
            quantidade,
            produtos!inner(produto, nome_variacao, produto_pai_id, unidade, media_por_caixa)
          `);

        if (error) {
          console.error('Erro ao buscar estoque:', error);
          return;
        }

        console.log('Dados de estoque brutos:', data);

        // Agrupar por produto
        const estoquesAgrupados: { [produto_id: string]: EstoqueProduto } = {};

        data?.forEach(item => {
          const produtoId = item.produto_id;
          const produto = item.produtos as any;
          
          if (!estoquesAgrupados[produtoId]) {
            // Para variações, usar nome_variacao, para principais usar produto
            const nomeDisplay = produto?.nome_variacao || produto?.produto || '';
            
            estoquesAgrupados[produtoId] = {
              produto_id: produtoId,
              produto_nome: nomeDisplay,
              nome_variacao: produto?.nome_variacao,
              produto_pai_id: produto?.produto_pai_id,
              unidade: produto?.unidade || '',
              media_por_caixa: produto?.media_por_caixa || 20,
              estoques_por_loja: {},
              total_estoque: 0,
              total_kg: 0
            };
          }

          // Obter nome atual da loja
          const lojaAtual = lojas.find(l => l.nome === item.loja);
          const nomeLojaAtual = lojaAtual ? lojaAtual.nome : item.loja;

          // Adicionar quantidade por loja usando nome atual
          estoquesAgrupados[produtoId].estoques_por_loja[nomeLojaAtual] = item.quantidade || 0;
          estoquesAgrupados[produtoId].total_estoque += item.quantidade || 0;
        });

        // Calcular total em kg para produtos em caixas
        Object.values(estoquesAgrupados).forEach(estoque => {
          if (estoque.unidade.toLowerCase() === 'caixa') {
            estoque.total_kg = estoque.total_estoque * estoque.media_por_caixa;
          }
        });

        const estoquesArray = Object.values(estoquesAgrupados);
        console.log('Estoques processados:', estoquesArray);
        
        setEstoqueProdutos(estoquesArray);
      } catch (error) {
        console.error('Erro ao buscar estoque:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstoque();

    // Configurar listener para atualizações em tempo real
    const channel = supabase
      .channel('estoque-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estoque_atual'
        },
        () => {
          console.log('Mudança detectada no estoque, recarregando...');
          fetchEstoque();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lojas]); // Adicionado lojas como dependência

  const obterEstoqueProduto = (produtoNome: string, tipo?: string) => {
    console.log('Buscando estoque para:', { produtoNome, tipo });
    
    // Buscar produto por nome exato ou similaridade
    const estoque = estoqueProdutos.find(item => {
      const nomeNorm = item.produto_nome.toLowerCase().trim();
      const produtoNorm = produtoNome.toLowerCase().trim();
      const tipoNorm = tipo?.toLowerCase().trim() || '';
      
      console.log('Comparando:', { nomeNorm, produtoNorm, tipoNorm });
      
      // Buscar por nome exato primeiro
      if (nomeNorm === produtoNorm || (tipoNorm && nomeNorm === tipoNorm)) {
        return true;
      }
      
      // Buscar por similaridade (contém)
      const contemProduto = nomeNorm.includes(produtoNorm) || produtoNorm.includes(nomeNorm);
      const contemTipo = tipoNorm && (nomeNorm.includes(tipoNorm) || tipoNorm.includes(nomeNorm));
      
      return contemProduto || contemTipo;
    });

    console.log('Estoque encontrado:', estoque);
    return estoque || null;
  };

  const obterEstoquesDisplay = (produtoNome: string, tipo?: string) => {
    const estoque = obterEstoqueProduto(produtoNome, tipo);
    
    if (!estoque || Object.keys(estoque.estoques_por_loja).length === 0) {
      return 'Sem estoque informado';
    }

    // Formatar estoques por loja
    const estoquesFormatados = Object.entries(estoque.estoques_por_loja)
      .filter(([_, quantidade]) => quantidade > 0)
      .map(([loja, quantidade]) => `${loja}: ${quantidade} ${estoque.unidade}`)
      .join(', ');

    return estoquesFormatados || 'Estoque zerado';
  };

  return { 
    estoqueProdutos, 
    isLoading, 
    obterEstoqueProduto, 
    obterEstoquesDisplay 
  };
};
