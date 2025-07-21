import { supabase } from '@/integrations/supabase/client';

// Cache para produtos para melhorar performance
interface ProdutoCache {
  id: string;
  produto: string;
  nome_base: string | null;
  nome_variacao: string | null;
  produto_pai_id: string | null;
  ativo: boolean;
  media_por_caixa: number | null;
}

interface CacheData {
  produtos: ProdutoCache[];
  produtosPai: Map<string, ProdutoCache>;
  variacoes: Map<string, ProdutoCache[]>;
  lastUpdate: number;
  ttl: number; // Time to live em ms
}

let cache: CacheData | null = null;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos - aumentado para reduzir reloads

// Logging utilitário para rastreamento
export const logProductMapping = (
  action: string,
  details: Record<string, any> = {}
) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    ...details
  };
  
  console.log(`[ProductMapping] ${action}:`, logEntry);
  
  // Em produção, podemos enviar para sistema de logging
  // sendToLoggingService(logEntry);
};

// Função para limpar cache manualmente
export const clearProductCache = () => {
  cache = null;
  logProductMapping('CACHE_CLEARED', {});
};

// Função para verificar se cache é válido
const isCacheValid = (): boolean => {
  if (!cache) return false;
  const now = Date.now();
  return (now - cache.lastUpdate) < cache.ttl;
};

// Função para carregar produtos do banco e criar cache
const loadProductsToCache = async (): Promise<CacheData> => {
  logProductMapping('CACHE_LOADING', {});
  
  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, produto, nome_base, nome_variacao, produto_pai_id, ativo, media_por_caixa')
    .eq('ativo', true);

  if (error) {
    logProductMapping('CACHE_ERROR', { details: error.message });
    throw new Error(`Erro ao carregar produtos: ${error.message}`);
  }

  if (!produtos) {
    logProductMapping('CACHE_EMPTY', {});
    throw new Error('Nenhum produto encontrado');
  }

  // Organizar produtos pai e variações
  const produtosPai = new Map<string, ProdutoCache>();
  const variacoes = new Map<string, ProdutoCache[]>();

  produtos.forEach(produto => {
    if (!produto.produto_pai_id) {
      // É um produto pai
      const chave = (produto.nome_base || produto.produto || '').toLowerCase();
      produtosPai.set(chave, produto);
    } else {
      // É uma variação
      const chave = produto.produto_pai_id;
      if (!variacoes.has(chave)) {
        variacoes.set(chave, []);
      }
      variacoes.get(chave)!.push(produto);
    }
  });

  const cacheData: CacheData = {
    produtos,
    produtosPai,
    variacoes,
    lastUpdate: Date.now(),
    ttl: CACHE_TTL
  };

  logProductMapping('CACHE_LOADED', { 
    totalProdutos: produtos.length,
    produtosPai: produtosPai.size,
    variações: variacoes.size
  });

  return cacheData;
};

// Função principal para buscar produto pai
export const buscarProdutoPai = async (nomeProduto: string): Promise<ProdutoCache | null> => {
  try {
    // Verificar e atualizar cache se necessário
    if (!isCacheValid()) {
      cache = await loadProductsToCache();
    }

    if (!cache) {
      logProductMapping('CACHE_UNAVAILABLE', { produto: nomeProduto });
      return null;
    }

    const chaveNormalizada = nomeProduto.toLowerCase().trim();
    
    // Buscar produto pai diretamente
    const produtoPai = cache.produtosPai.get(chaveNormalizada);
    
    if (produtoPai) {
      logProductMapping('PRODUTO_PAI_ENCONTRADO', {
        original: nomeProduto,
        produto: produtoPai.produto,
        produtoId: produtoPai.id,
        source: 'pai'
      });
      return produtoPai;
    }

    // Buscar por correspondência parcial no nome_base ou produto
    for (const [chave, produto] of cache.produtosPai.entries()) {
      if (chave.includes(chaveNormalizada) || chaveNormalizada.includes(chave)) {
        logProductMapping('PRODUTO_PAI_ENCONTRADO_PARCIAL', {
          original: nomeProduto,
          produto: produto.produto,
          produtoId: produto.id,
          source: 'pai',
          confidence: 0.7
        });
        return produto;
      }
    }

    logProductMapping('PRODUTO_PAI_NAO_ENCONTRADO', { produto: nomeProduto });
    return null;

  } catch (error: any) {
    logProductMapping('ERRO_BUSCAR_PRODUTO_PAI', { 
      produto: nomeProduto,
      error: error.message 
    });
    return null;
  }
};

// Função para buscar variação específica
export const buscarVariacao = async (nomeProduto: string, nomeVariacao: string): Promise<ProdutoCache | null> => {
  try {
    if (!isCacheValid()) {
      cache = await loadProductsToCache();
    }

    if (!cache) return null;

    // Primeiro buscar o produto pai
    const produtoPai = await buscarProdutoPai(nomeProduto);
    if (!produtoPai) return null;

    // Buscar variações do produto pai
    const variacoesDoPai = cache.variacoes.get(produtoPai.id) || [];
    const nomeVariacaoNormalizado = nomeVariacao.toLowerCase().trim();

    // Buscar correspondência exata
    for (const variacao of variacoesDoPai) {
      const nomeVariacaoProduto = (variacao.nome_variacao || '').toLowerCase();
      if (nomeVariacaoProduto === nomeVariacaoNormalizado) {
        logProductMapping('VARIACAO_ENCONTRADA', {
          original: `${nomeProduto} ${nomeVariacao}`,
          produto: variacao.produto,
          tipo: variacao.nome_variacao,
          produtoId: variacao.id,
          source: 'variacao'
        });
        return variacao;
      }
    }

    // Buscar correspondência parcial
    for (const variacao of variacoesDoPai) {
      const nomeVariacaoProduto = (variacao.nome_variacao || '').toLowerCase();
      if (nomeVariacaoProduto.includes(nomeVariacaoNormalizado) || 
          nomeVariacaoNormalizado.includes(nomeVariacaoProduto)) {
        logProductMapping('VARIACAO_ENCONTRADA_PARCIAL', {
          original: `${nomeProduto} ${nomeVariacao}`,
          produto: variacao.produto,
          tipo: variacao.nome_variacao,
          produtoId: variacao.id,
          source: 'variacao',
          confidence: 0.7
        });
        return variacao;
      }
    }

    logProductMapping('VARIACAO_NAO_ENCONTRADA', { 
      produto: nomeProduto,
      variacao: nomeVariacao
    });
    return null;

  } catch (error: any) {
    logProductMapping('ERRO_BUSCAR_VARIACAO', { 
      produto: nomeProduto,
      variacao: nomeVariacao,
      error: error.message 
    });
    return null;
  }
};

// Função para determinar se um tipo é considerado "genérico" (deve ir para produto pai)
export const isGenericType = (tipo: string): boolean => {
  const tipoNormalizado = tipo.toLowerCase().trim();
  
  // Lista de tipos que indicam produto genérico (não uma variação específica)
  const tiposGenericos = [
    'padrão',
    'normal',
    'comum',
    'básico',
    'tradicional',
    'kg',
    'caixa',
    'unidade',
    '20kg',
    '10kg',
    '15kg',
    '25kg'
  ];

  // Verificar se é um tipo genérico
  const isGeneric = tiposGenericos.some(generico => 
    tipoNormalizado === generico || 
    tipoNormalizado.includes(generico)
  );

  if (isGeneric) {
    logProductMapping('TIPO_GENERICO_DETECTADO', { 
      tipo,
      source: 'generic_detection'
    });
  }

  return isGeneric;
};

// Função para obter estatísticas do cache
export const getCacheStats = () => {
  if (!cache) return null;
  
  return {
    isValid: isCacheValid(),
    totalProdutos: cache.produtos.length,
    produtosPai: cache.produtosPai.size,
    variacoes: cache.variacoes.size,
    lastUpdate: new Date(cache.lastUpdate).toISOString(),
    ttl: cache.ttl
  };
};