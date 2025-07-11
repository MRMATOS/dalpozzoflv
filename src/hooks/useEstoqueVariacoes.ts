
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  produto_pai_nome?: string;
}

export const useEstoqueVariacoes = () => {
  const [estoqueProdutos, setEstoqueProdutos] = useState<EstoqueProdutoVariacao[]>([]);
  const [mapaVariacoes, setMapaVariacoes] = useState<Map<string, EstoqueProdutoVariacao>>(new Map());
  const [mapaProdutosPai, setMapaProdutosPai] = useState<Map<string, EstoqueProdutoVariacao[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache e controle de operações
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const isOperatingRef = useRef(false);
  const lastFetchRef = useRef(0);
  const CACHE_TTL = 30000; // 30 segundos

  // Função para normalizar texto (remove acentos, converte para minúscula)
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Função para criar chaves de busca inteligente
  const criarChavesBusca = (produto: any): string[] => {
    const chaves: string[] = [];
    
    if (produto.nome_variacao) {
      // É uma variação
      chaves.push(normalizarTexto(produto.nome_variacao));
      if (produto.produto_pai_nome) {
        chaves.push(normalizarTexto(`${produto.produto_pai_nome} ${produto.nome_variacao}`));
        chaves.push(normalizarTexto(`${produto.produto_pai_nome}-${produto.nome_variacao}`));
      }
    } else if (produto.produto) {
      // É um produto principal
      chaves.push(normalizarTexto(produto.produto));
    }

    return chaves.filter(Boolean);
  };

  const fetchEstoque = async () => {
    // Evitar múltiplas execuções simultâneas
    if (isOperatingRef.current) return;
    
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) return; // Debounce de 1 segundo
    
    // Verificar cache
    const cacheKey = 'estoque_variacoes';
    const cached = cacheRef.current.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return;
    }
    
    try {
      isOperatingRef.current = true;
      setIsLoading(true);
      setError(null);
      lastFetchRef.current = now;
      
      // Buscar produtos com informações dos produtos pai
      const { data, error } = await supabase
        .from('estoque_atual')
        .select(`
          produto_id,
          loja,
          quantidade,
          produtos!inner(
            produto, 
            nome_variacao, 
            produto_pai_id, 
            unidade, 
            media_por_caixa, 
            ativo,
            produto_pai:produtos(produto)
          )
        `)
        .eq('produtos.ativo', true);

      if (error) {
        setError(`Erro ao carregar estoque: ${error.message}`);
        return;
      }

      // Cache dos dados
      cacheRef.current.set(cacheKey, { data, timestamp: now });

      // Processar produtos e criar mapas otimizados
      const estoquesAgrupados: { [produto_id: string]: EstoqueProdutoVariacao } = {};
      const mapVariacoes = new Map<string, EstoqueProdutoVariacao>();
      const mapProdutosPai = new Map<string, EstoqueProdutoVariacao[]>();

      data?.forEach(item => {
        const produtoId = item.produto_id;
        const produto = item.produtos as any;
        const produtoPai = produto?.produto_pai as any;
        
        if (!estoquesAgrupados[produtoId]) {
          const isVariacao = !!produto?.nome_variacao;
          const produtoPaiNome = produtoPai?.produto || produto?.produto;
          const nomeDisplay = isVariacao 
            ? produto?.nome_variacao 
            : produto?.produto || '';
          
          const estoqueProduto: EstoqueProdutoVariacao = {
            produto_id: produtoId,
            produto_nome: nomeDisplay,
            nome_variacao: produto?.nome_variacao,
            produto_pai_id: produto?.produto_pai_id,
            produto_pai_nome: produtoPaiNome,
            unidade: produto?.unidade || '',
            media_por_caixa: produto?.media_por_caixa || 20,
            ativo: produto?.ativo || false,
            is_variacao: isVariacao,
            estoques_por_loja: {},
            total_estoque: 0,
            total_kg: 0
          };

          estoquesAgrupados[produtoId] = estoqueProduto;

          // Criar chaves de busca inteligente
          const chavesBusca = criarChavesBusca({
            ...produto,
            produto_pai_nome: produtoPaiNome
          });

          // Adicionar ao mapa de variações
          chavesBusca.forEach(chave => {
            if (!mapVariacoes.has(chave) || isVariacao) {
              mapVariacoes.set(chave, estoqueProduto);
            }
          });

          // Agrupar por produto pai para busca hierárquica
          if (produtoPaiNome) {
            const chavePai = normalizarTexto(produtoPaiNome);
            if (!mapProdutosPai.has(chavePai)) {
              mapProdutosPai.set(chavePai, []);
            }
            mapProdutosPai.get(chavePai)!.push(estoqueProduto);
          }
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
      
      setEstoqueProdutos(estoquesArray);
      setMapaVariacoes(mapVariacoes);
      setMapaProdutosPai(mapProdutosPai);
    } catch (error) {
      setError('Erro interno ao carregar dados de estoque');
    } finally {
      setIsLoading(false);
      isOperatingRef.current = false;
    }
  };

  // Função principal para busca inteligente de estoque (memoizada)
  const obterEstoqueProdutoInteligente = useMemo(() => {
    const cache = new Map<string, EstoqueProdutoVariacao | null>();
    
    return (produtoNome: string, tipo?: string) => {
      const cacheKey = `${produtoNome}|${tipo || ''}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }
      
      const produtoNorm = normalizarTexto(produtoNome);
      const tipoNorm = tipo ? normalizarTexto(tipo) : '';
      
      let resultado: EstoqueProdutoVariacao | null = null;
      
      // 1. Busca exata por combinação produto + tipo
      if (tipoNorm) {
        const chaveCombinadaCompleta = normalizarTexto(`${produtoNome} ${tipo}`);
        const estoqueCombinado = mapaVariacoes.get(chaveCombinadaCompleta);
        if (estoqueCombinado && estoqueCombinado.ativo) {
          resultado = estoqueCombinado;
        }

        // 2. Busca por tipo específico (variação)
        if (!resultado) {
          const estoquePorTipo = mapaVariacoes.get(tipoNorm);
          if (estoquePorTipo && estoquePorTipo.ativo) {
            resultado = estoquePorTipo;
          }
        }
      }
      
      // 3. Busca por nome do produto principal
      if (!resultado) {
        const estoquePorNome = mapaVariacoes.get(produtoNorm);
        if (estoquePorNome && estoquePorNome.ativo) {
          resultado = estoquePorNome;
        }
      }
      
      // 4. Busca hierárquica
      if (!resultado) {
        const variacoesDoPai = mapaProdutosPai.get(produtoNorm);
        if (variacoesDoPai && variacoesDoPai.length > 0) {
          if (tipoNorm) {
            const variacaoEspecifica = variacoesDoPai.find(v => 
              normalizarTexto(v.nome_variacao || '') === tipoNorm
            );
            if (variacaoEspecifica && variacaoEspecifica.ativo) {
              resultado = variacaoEspecifica;
            }
          }
          
          if (!resultado) {
            const primeiraVariacaoAtiva = variacoesDoPai.find(v => v.ativo);
            if (primeiraVariacaoAtiva) {
              resultado = primeiraVariacaoAtiva;
            }
          }
        }
      }
      
      // 5. Busca por similaridade
      if (!resultado) {
        for (const [chave, estoque] of mapaVariacoes.entries()) {
          if (!estoque.ativo) continue;
          
          const contemTipo = tipoNorm && (chave.includes(tipoNorm) || tipoNorm.includes(chave));
          const contemProduto = chave.includes(produtoNorm) || produtoNorm.includes(chave);
          
          if (contemTipo || contemProduto) {
            resultado = estoque;
            break;
          }
        }
      }

      cache.set(cacheKey, resultado);
      return resultado;
    };
  }, [mapaVariacoes, mapaProdutosPai]);

  const obterEstoquesDisplayInteligente = useMemo(() => {
    const cache = new Map<string, { jsx: React.ReactNode; isVariacao: boolean; temEstoque: boolean }>();
    
    return (produtoNome: string, tipo?: string) => {
      const cacheKey = `${produtoNome}|${tipo || ''}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }
      
      const estoque = obterEstoqueProdutoInteligente(produtoNome, tipo);
      
      if (!estoque || Object.keys(estoque.estoques_por_loja).length === 0) {
        const resultado = {
          jsx: React.createElement('div', { className: 'text-gray-400 text-sm' }, 'Sem estoque informado'),
          isVariacao: false,
          temEstoque: false
        };
        cache.set(cacheKey, resultado);
        return resultado;
      }

      const estoquesFormatados = Object.entries(estoque.estoques_por_loja)
        .filter(([_, quantidade]) => quantidade > 0);

      if (estoquesFormatados.length === 0) {
        const resultado = {
          jsx: React.createElement('div', { className: 'text-gray-400 text-sm' }, 'Estoque zerado'),
          isVariacao: estoque.is_variacao,
          temEstoque: false
        };
        cache.set(cacheKey, resultado);
        return resultado;
      }

      const jsx = React.createElement('div', { className: 'text-sm space-y-1' }, 
        ...estoquesFormatados.map(([loja, quantidade]) => 
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
          estoque.is_variacao && React.createElement('span', { className: 'text-xs text-green-600 ml-1' }, '(variação)'),
          estoque.produto_pai_nome && React.createElement('div', { className: 'text-xs text-blue-600' }, 
            `${estoque.produto_pai_nome} → ${estoque.nome_variacao}`
          )
        )
      );

      const resultado = {
        jsx,
        isVariacao: estoque.is_variacao,
        temEstoque: true
      };
      
      cache.set(cacheKey, resultado);
      return resultado;
    };
  }, [obterEstoqueProdutoInteligente]);

  useEffect(() => {
    fetchEstoque();

    // Debounced listener para mudanças no estoque
    let timeoutId: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isOperatingRef.current) {
          fetchEstoque();
        }
      }, 2000); // 2 segundos de debounce
    };

    const estoqueChannel = supabase
      .channel('estoque-variacoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque_atual' }, debouncedFetch)
      .subscribe();

    const produtosChannel = supabase
      .channel('produtos-variacoes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, debouncedFetch)
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
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
