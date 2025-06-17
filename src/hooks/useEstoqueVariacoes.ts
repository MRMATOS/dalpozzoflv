
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EstoqueProdutoVariacao {
  produto_id: string;
  produto_nome: string;
  nome_variacao?: string;
  produto_pai_id?: string;
  unidade: string;
  media_por_caixa: number;
  estoques_por_loja: { [loja: string]: number };
  total_estoque: number;
  total_kg: number;
  ativo: boolean;
  is_variacao: boolean;
}

export const useEstoqueVariacoes = () => {
  const [estoqueProdutos, setEstoqueProdutos] = useState<EstoqueProdutoVariacao[]>([]);
  const [mapaVariacoes, setMapaVariacoes] = useState<Map<string, EstoqueProdutoVariacao>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstoque = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Buscando dados de estoque com variações...');
      
      const { data, error } = await supabase
        .from('estoque_atual')
        .select(`
          produto_id,
          loja,
          quantidade,
          produtos!inner(produto, nome_variacao, produto_pai_id, unidade, media_por_caixa, ativo)
        `)
        .eq('produtos.ativo', true);

      if (error) {
        console.error('Erro ao buscar estoque:', error);
        setError(`Erro ao carregar estoque: ${error.message}`);
        return;
      }

      console.log('Dados de estoque brutos:', data);

      // Processar produtos e criar mapa de variações
      const estoquesAgrupados: { [produto_id: string]: EstoqueProdutoVariacao } = {};
      const mapVariacoes = new Map<string, EstoqueProdutoVariacao>();

      data?.forEach(item => {
        const produtoId = item.produto_id;
        const produto = item.produtos as any;
        
        if (!estoquesAgrupados[produtoId]) {
          const nomeDisplay = produto?.nome_variacao || produto?.produto || '';
          const isVariacao = !!produto?.nome_variacao;
          
          const estoqueProduto: EstoqueProdutoVariacao = {
            produto_id: produtoId,
            produto_nome: nomeDisplay,
            nome_variacao: produto?.nome_variacao,
            produto_pai_id: produto?.produto_pai_id,
            unidade: produto?.unidade || '',
            media_por_caixa: produto?.media_por_caixa || 20,
            ativo: produto?.ativo || false,
            is_variacao: isVariacao,
            estoques_por_loja: {},
            total_estoque: 0,
            total_kg: 0
          };

          estoquesAgrupados[produtoId] = estoqueProduto;

          // Criar entradas no mapa para busca inteligente
          const chavesParaBusca = [
            nomeDisplay.toLowerCase().trim(),
            produto?.produto?.toLowerCase().trim(),
            produto?.nome_variacao?.toLowerCase().trim()
          ].filter(Boolean);

          chavesParaBusca.forEach(chave => {
            if (chave && (!mapVariacoes.has(chave) || isVariacao)) {
              mapVariacoes.set(chave, estoqueProduto);
            }
          });
        }

        estoquesAgrupados[produtoId].estoques_por_loja[item.loja] = item.quantidade || 0;
        estoquesAgrupados[produtoId].total_estoque += item.quantidade || 0;
      });

      // Calcular total em kg
      Object.values(estoquesAgrupados).forEach(estoque => {
        if (estoque.unidade.toLowerCase() === 'caixa') {
          estoque.total_kg = estoque.total_estoque * estoque.media_por_caixa;
        }
      });

      const estoquesArray = Object.values(estoquesAgrupados);
      console.log('Estoques processados:', estoquesArray);
      console.log('Mapa de variações criado:', mapVariacoes);
      
      setEstoqueProdutos(estoquesArray);
      setMapaVariacoes(mapVariacoes);
    } catch (error) {
      console.error('Erro geral ao buscar estoque:', error);
      setError('Erro interno ao carregar dados de estoque');
    } finally {
      setIsLoading(false);
    }
  };

  // Função principal para buscar estoque considerando variações
  const obterEstoqueProdutoInteligente = (produtoNome: string, tipo?: string) => {
    console.log('Buscando estoque inteligente para:', { produtoNome, tipo });
    
    const produtoNorm = produtoNome.toLowerCase().trim();
    const tipoNorm = tipo?.toLowerCase().trim() || '';
    
    // 1. Tentar buscar por tipo (variação) primeiro se fornecido
    if (tipoNorm) {
      const estoquePorTipo = mapaVariacoes.get(tipoNorm);
      if (estoquePorTipo && estoquePorTipo.ativo) {
        console.log('Encontrado estoque por tipo:', estoquePorTipo);
        return estoquePorTipo;
      }
    }
    
    // 2. Buscar por nome do produto
    const estoquePorNome = mapaVariacoes.get(produtoNorm);
    if (estoquePorNome && estoquePorNome.ativo) {
      console.log('Encontrado estoque por nome:', estoquePorNome);
      return estoquePorNome;
    }
    
    // 3. Busca por similaridade (contém)
    for (const [chave, estoque] of mapaVariacoes.entries()) {
      if (!estoque.ativo) continue;
      
      const contemTipo = tipoNorm && (chave.includes(tipoNorm) || tipoNorm.includes(chave));
      const contemProduto = chave.includes(produtoNorm) || produtoNorm.includes(chave);
      
      if (contemTipo || contemProduto) {
        console.log('Encontrado estoque por similaridade:', estoque);
        return estoque;
      }
    }

    console.log('Nenhum estoque encontrado para:', { produtoNome, tipo });
    return null;
  };

  const obterEstoquesDisplayInteligente = (produtoNome: string, tipo?: string) => {
    const estoque = obterEstoqueProdutoInteligente(produtoNome, tipo);
    
    if (!estoque || Object.keys(estoque.estoques_por_loja).length === 0) {
      return {
        jsx: React.createElement('div', { className: 'text-gray-400 text-sm' }, 'Sem estoque informado'),
        isVariacao: false,
        temEstoque: false
      };
    }

    const estoquesFormatados = Object.entries(estoque.estoques_por_loja)
      .filter(([_, quantidade]) => quantidade > 0)
      .map(([loja, quantidade]) => `${loja}: ${quantidade} ${estoque.unidade}`)
      .join(', ');

    if (!estoquesFormatados) {
      return {
        jsx: React.createElement('div', { className: 'text-gray-400 text-sm' }, 'Estoque zerado'),
        isVariacao: estoque.is_variacao,
        temEstoque: false
      };
    }

    const jsx = React.createElement('div', { className: 'text-sm space-y-1' }, 
      ...Object.entries(estoque.estoques_por_loja)
        .filter(([_, quantidade]) => quantidade > 0)
        .map(([loja, quantidade]) => 
          React.createElement('div', { key: loja, className: 'text-gray-600' }, 
            `${loja}: `,
            React.createElement('span', { className: 'font-medium' }, quantidade),
            ` ${estoque.unidade.toLowerCase()}`
          )
        ),
      React.createElement('div', { 
        className: `font-semibold border-t pt-1 ${estoque.is_variacao ? 'text-green-700' : 'text-gray-800'}` 
      }, 
        `Total: ${estoque.total_estoque} ${estoque.unidade.toLowerCase()}`,
        estoque.is_variacao && React.createElement('span', { className: 'text-xs text-green-600 ml-1' }, '(variação)')
      )
    );

    return {
      jsx,
      isVariacao: estoque.is_variacao,
      temEstoque: true
    };
  };

  useEffect(() => {
    fetchEstoque();

    // Configurar listeners para atualizações em tempo real
    const estoqueChannel = supabase
      .channel('estoque-variacoes-changes')
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

    const produtosChannel = supabase
      .channel('produtos-variacoes-changes')
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
  }, []);

  return { 
    estoqueProdutos, 
    isLoading, 
    error,
    obterEstoqueProdutoInteligente, 
    obterEstoquesDisplayInteligente,
    recarregarEstoque: fetchEstoque
  };
};
