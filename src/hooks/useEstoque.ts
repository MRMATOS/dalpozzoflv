
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EstoqueProduto {
  produto_id: string;
  produto_nome: string;
  unidade: string;
  media_por_caixa: number;
  estoques_por_loja: { [loja: string]: number };
  total_estoque: number;
  total_kg: number;
}

export const useEstoque = () => {
  const [estoqueProdutos, setEstoqueProdutos] = useState<EstoqueProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            produtos!inner(produto, unidade, media_por_caixa)
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
            estoquesAgrupados[produtoId] = {
              produto_id: produtoId,
              produto_nome: produto?.produto || '',
              unidade: produto?.unidade || '',
              media_por_caixa: produto?.media_por_caixa || 20,
              estoques_por_loja: {},
              total_estoque: 0,
              total_kg: 0
            };
          }

          // Adicionar quantidade por loja
          estoquesAgrupados[produtoId].estoques_por_loja[item.loja] = item.quantidade || 0;
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
  }, []);

  const obterEstoqueProduto = (produtoNome: string, tipo: string) => {
    // Buscar produto por nome exato ou similaridade
    const estoque = estoqueProdutos.find(item => {
      const nomeNorm = item.produto_nome.toLowerCase().trim();
      const produtoNorm = produtoNome.toLowerCase().trim();
      const tipoNorm = tipo.toLowerCase().trim();
      
      return nomeNorm.includes(produtoNorm) || 
             produtoNorm.includes(nomeNorm) ||
             nomeNorm.includes(tipoNorm) ||
             tipoNorm.includes(nomeNorm);
    });

    return estoque || null;
  };

  return { estoqueProdutos, isLoading, obterEstoqueProduto };
};
