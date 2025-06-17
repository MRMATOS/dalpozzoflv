import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLojas } from './useLojas';

interface EstoqueProduto {
  produto_id: string;
  produto_nome: string;
  nome_variacao?: string;
  produto_pai_id?: string;
  produto_pai_nome?: string;
  unidade: string;
  media_por_caixa: number;
  estoques_por_loja: { [loja: string]: number };
  total_estoque: number;
  total_kg: number;
  ativo: boolean;
}

export const useEstoque = () => {
  const [estoqueProdutos, setEstoqueProdutos] = useState<EstoqueProduto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { lojas } = useLojas();

  const fetchEstoque = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Buscando dados de estoque usando view produtos_com_pai com relacionamento explícito...');
      
      const { data, error } = await supabase
        .from('estoque_atual')
        .select(`
          produto_id,
          loja,
          quantidade,
          produtos_com_pai!estoque_atual_produto_id_produtos_com_pai_id_fkey(
            produto, 
            nome_variacao, 
            produto_pai_id, 
            produto_pai_nome,
            unidade, 
            media_por_caixa, 
            ativo
          )
        `)
        .eq('produtos_com_pai.ativo', true);

      if (error) {
        console.error('Erro ao buscar estoque:', error);
        setError(`Erro ao carregar estoque: ${error.message}`);
        return;
      }

      console.log('Dados de estoque brutos com relacionamento resolvido:', data);

      // Agrupar por produto
      const estoquesAgrupados: { [produto_id: string]: EstoqueProduto } = {};

      data?.forEach(item => {
        const produtoId = item.produto_id;
        const produto = item.produtos_com_pai as any;
        
        if (!estoquesAgrupados[produtoId]) {
          // Para variações, usar nome_variacao + produto_pai_nome, para principais usar produto
          let nomeDisplay = '';
          if (produto?.produto_pai_nome && produto?.nome_variacao) {
            nomeDisplay = `${produto.produto_pai_nome} ${produto.nome_variacao}`;
          } else {
            nomeDisplay = produto?.produto || produto?.nome_variacao || '';
          }
          
          estoquesAgrupados[produtoId] = {
            produto_id: produtoId,
            produto_nome: nomeDisplay,
            nome_variacao: produto?.nome_variacao,
            produto_pai_id: produto?.produto_pai_id,
            produto_pai_nome: produto?.produto_pai_nome,
            unidade: produto?.unidade || '',
            media_por_caixa: produto?.media_por_caixa || 20,
            ativo: produto?.ativo || false,
            estoques_por_loja: {},
            total_estoque: 0,
            total_kg: 0
          };
        }

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
      console.log('Estoques processados com relacionamento pai resolvido:', estoquesArray);
      
      setEstoqueProdutos(estoquesArray);
    } catch (error) {
      console.error('Erro geral ao buscar estoque:', error);
      setError('Erro interno ao carregar dados de estoque');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstoque();

    // Configurar listener para atualizações em tempo real na tabela estoque_atual
    const estoqueChannel = supabase
      .channel('estoque-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estoque_atual'
        },
        (payload) => {
          console.log('Mudança detectada no estoque:', payload);
          fetchEstoque();
        }
      )
      .subscribe();

    // Configurar listener para atualizações em tempo real na tabela produtos
    const produtosChannel = supabase
      .channel('produtos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos'
        },
        (payload) => {
          console.log('Mudança detectada em produtos:', payload);
          fetchEstoque();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(estoqueChannel);
      supabase.removeChannel(produtosChannel);
    };
  }, [lojas]);

  const obterEstoqueProduto = (produtoNome: string, tipo?: string) => {
    console.log('Buscando estoque para:', { produtoNome, tipo });
    
    const estoque = estoqueProdutos.find(item => {
      if (!item.ativo) return false;
      
      const nomeNorm = item.produto_nome.toLowerCase().trim();
      const produtoNorm = produtoNome.toLowerCase().trim();
      const tipoNorm = tipo?.toLowerCase().trim() || '';
      
      console.log('Comparando:', { nomeNorm, produtoNorm, tipoNorm, ativo: item.ativo });
      
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

    const estoquesFormatados = Object.entries(estoque.estoques_por_loja)
      .filter(([_, quantidade]) => quantidade > 0)
      .map(([loja, quantidade]) => `${loja}: ${quantidade} ${estoque.unidade}`)
      .join(', ');

    return estoquesFormatados || 'Estoque zerado';
  };

  return { 
    estoqueProdutos, 
    isLoading, 
    error,
    obterEstoqueProduto, 
    obterEstoquesDisplay,
    recarregarEstoque: fetchEstoque
  };
};
