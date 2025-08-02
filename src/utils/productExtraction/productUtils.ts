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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos - reduzido para testar correções

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
      const chave = (produto.nome_base || produto.produto || '').toLowerCase().trim();
      produtosPai.set(chave, produto);
      
      // Também adicionar sem acentos para busca mais robusta
      const chaveSemAcento = chave.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (chaveSemAcento !== chave) {
        produtosPai.set(chaveSemAcento, produto);
      }
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
    const chaveSemAcento = chaveNormalizada.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // Buscar produto pai diretamente - primeiro com acentos, depois sem
    let produtoPai = cache.produtosPai.get(chaveNormalizada);
    if (!produtoPai && chaveSemAcento !== chaveNormalizada) {
      produtoPai = cache.produtosPai.get(chaveSemAcento);
    }
    
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
      const chaveSemAcentoAtual = chave.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      if (chave.includes(chaveNormalizada) || chaveNormalizada.includes(chave) ||
          chaveSemAcentoAtual.includes(chaveSemAcento) || chaveSemAcento.includes(chaveSemAcentoAtual)) {
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

// Função para normalizar texto para matching
const normalizarParaMatching = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, ' ') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Múltiplos espaços -> um espaço
    .trim();
};

// Função para extrair tipo base de um tipo completo
const extrairTipoBase = (tipoCompleto: string): string => {
  const tipoNormalizado = normalizarParaMatching(tipoCompleto);
  
  // Lista de palavras que devem ser removidas para encontrar o tipo base
  const palavrasExtras = [
    'graudo', 'graúdo', 'medio', 'médio', 'miudo', 'miúdo',
    'grande', 'pequeno', 'extra', 'especial', 'top', 'premium',
    'klaina', 'leve', 'lev', 'comum', 'tradicional', 'normal',
    'kg', 'k', 'quilo', 'caixa', 'cx', 'bandeja', 'bdj',
    'unidade', 'un', 'maco', 'maço', '20kg', '15kg', '10kg', '25kg'
  ];
  
  let tipoBase = tipoNormalizado;
  
  // Remove palavras extras uma por uma
  for (const palavra of palavrasExtras) {
    tipoBase = tipoBase.replace(new RegExp(`\\b${palavra}\\b`, 'g'), ' ');
  }
  
  // Limpa espaços extras e retorna
  tipoBase = tipoBase.replace(/\s+/g, ' ').trim();
  
  // Se ficou vazio, usar o tipo original
  if (!tipoBase) {
    tipoBase = tipoNormalizado.split(' ')[0]; // Primeira palavra
  }
  
  logProductMapping('TIPO_BASE_EXTRAIDO', {
    original: tipoCompleto,
    tipoBase: tipoBase,
    source: 'normalizacao'
  });
  
  return tipoBase;
};

// Função aprimorada para buscar variação específica
export const buscarVariacao = async (nomeProduto: string, nomeVariacao: string): Promise<ProdutoCache | null> => {
  try {
    if (!isCacheValid()) {
      cache = await loadProductsToCache();
    }

    if (!cache) return null;

    // Primeiro buscar o produto pai
    const produtoPai = await buscarProdutoPai(nomeProduto);
    if (!produtoPai) {
      logProductMapping('PRODUTO_PAI_NAO_ENCONTRADO_PARA_VARIACAO', {
        produto: nomeProduto,
        variacao: nomeVariacao
      });
      return null;
    }

    // Buscar variações do produto pai
    const variacoesDoPai = cache.variacoes.get(produtoPai.id) || [];
    
    if (variacoesDoPai.length === 0) {
      logProductMapping('SEM_VARIACOES_CADASTRADAS', {
        produto: nomeProduto,
        produtoId: produtoPai.id,
        variacao: nomeVariacao
      });
      return null;
    }

    const nomeVariacaoNormalizado = normalizarParaMatching(nomeVariacao);
    const tipoBase = extrairTipoBase(nomeVariacao);
    
    logProductMapping('BUSCANDO_VARIACAO', {
      produto: nomeProduto,
      variacaoOriginal: nomeVariacao,
      variacaoNormalizada: nomeVariacaoNormalizado,
      tipoBase: tipoBase,
      totalVariacoes: variacoesDoPai.length,
      variacoesDisponiveis: variacoesDoPai.map(v => v.nome_variacao)
    });

    // 1. Buscar correspondência exata com tipo base
    for (const variacao of variacoesDoPai) {
      const nomeVariacaoProduto = normalizarParaMatching(variacao.nome_variacao || '');
      if (nomeVariacaoProduto === tipoBase) {
        // Construir nome completo: produto pai + variação
        const nomeCompleto = `${produtoPai.nome_base || produtoPai.produto || 'Produto'} ${variacao.nome_variacao || ''}`.trim();
        const variacaoCompleta = {
          ...variacao,
          produto: nomeCompleto
        };
        
        logProductMapping('VARIACAO_ENCONTRADA_TIPO_BASE', {
          original: `${nomeProduto} ${nomeVariacao}`,
          produto: variacaoCompleta.produto,
          tipo: variacao.nome_variacao,
          produtoId: variacao.id,
          source: 'exato_tipo_base',
          confidence: 0.95
        });
        return variacaoCompleta;
      }
    }

    // 2. Buscar correspondência exata completa
    for (const variacao of variacoesDoPai) {
      const nomeVariacaoProduto = normalizarParaMatching(variacao.nome_variacao || '');
      if (nomeVariacaoProduto === nomeVariacaoNormalizado) {
        // Construir nome completo: produto pai + variação
        const nomeCompleto = `${produtoPai.nome_base || produtoPai.produto || 'Produto'} ${variacao.nome_variacao || ''}`.trim();
        const variacaoCompleta = {
          ...variacao,
          produto: nomeCompleto
        };
        
        logProductMapping('VARIACAO_ENCONTRADA_EXATA', {
          original: `${nomeProduto} ${nomeVariacao}`,
          produto: variacaoCompleta.produto,
          tipo: variacao.nome_variacao,
          produtoId: variacao.id,
          source: 'exato_completo',
          confidence: 1.0
        });
        return variacaoCompleta;
      }
    }

    // 3. Buscar correspondência onde variação contém tipo base
    for (const variacao of variacoesDoPai) {
      const nomeVariacaoProduto = normalizarParaMatching(variacao.nome_variacao || '');
      if (nomeVariacaoProduto.includes(tipoBase) || tipoBase.includes(nomeVariacaoProduto)) {
        // Construir nome completo: produto pai + variação
        const nomeCompleto = `${produtoPai.nome_base || produtoPai.produto || 'Produto'} ${variacao.nome_variacao || ''}`.trim();
        const variacaoCompleta = {
          ...variacao,
          produto: nomeCompleto
        };
        
        logProductMapping('VARIACAO_ENCONTRADA_PARCIAL_TIPO_BASE', {
          original: `${nomeProduto} ${nomeVariacao}`,
          produto: variacaoCompleta.produto,
          tipo: variacao.nome_variacao,
          produtoId: variacao.id,
          source: 'parcial_tipo_base',
          confidence: 0.8
        });
        return variacaoCompleta;
      }
    }

    // 4. Buscar correspondência parcial com texto completo
    for (const variacao of variacoesDoPai) {
      const nomeVariacaoProduto = normalizarParaMatching(variacao.nome_variacao || '');
      if (nomeVariacaoProduto.includes(nomeVariacaoNormalizado) || 
          nomeVariacaoNormalizado.includes(nomeVariacaoProduto)) {
        // Construir nome completo: produto pai + variação
        const nomeCompleto = `${produtoPai.nome_base || produtoPai.produto || 'Produto'} ${variacao.nome_variacao || ''}`.trim();
        const variacaoCompleta = {
          ...variacao,
          produto: nomeCompleto
        };
        
        logProductMapping('VARIACAO_ENCONTRADA_PARCIAL_COMPLETA', {
          original: `${nomeProduto} ${nomeVariacao}`,
          produto: variacaoCompleta.produto,
          tipo: variacao.nome_variacao,
          produtoId: variacao.id,
          source: 'parcial_completo',
          confidence: 0.7
        });
        return variacaoCompleta;
      }
    }

    logProductMapping('VARIACAO_NAO_ENCONTRADA', { 
      produto: nomeProduto,
      variacao: nomeVariacao,
      variacaoNormalizada: nomeVariacaoNormalizado,
      tipoBase: tipoBase,
      variacoesDisponiveis: variacoesDoPai.map(v => v.nome_variacao),
      tentativasRealizadas: ['exato_tipo_base', 'exato_completo', 'parcial_tipo_base', 'parcial_completo']
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

// Função aprimorada para determinar se um tipo é considerado "genérico" (deve ir para produto pai)
export const isGenericType = (tipo: string): boolean => {
  const tipoNormalizado = normalizarParaMatching(tipo);
  
  // Lista expandida de tipos que indicam produto genérico (não uma variação específica)
  const tiposGenericos = [
    'padrao', 'padrão',
    'normal',
    'comum',
    'basico', 'básico',
    'tradicional',
    'kg', 'k', 'quilo',
    'caixa', 'cx',
    'unidade', 'un',
    'bandeja', 'bdj',
    'maco', 'maço',
    // Pesos específicos
    '20kg', '10kg', '15kg', '25kg', '5kg', '30kg',
    // Palavras que indicam quantidade/embalagem, não variação
    'graudo', 'graúdo', 'medio', 'médio', 'miudo', 'miúdo',
    'grande', 'pequeno', 'extra', 'top', 'premium', 'especial',
    // Nomes genéricos do próprio produto
    'comum', 'leve', 'lev'
  ];

  // Verificar se o tipo é completamente genérico
  const isCompletelyGeneric = tiposGenericos.some(generico => 
    tipoNormalizado === generico
  );

  // Verificar se contém apenas palavras genéricas
  const palavras = tipoNormalizado.split(' ').filter(p => p.length > 0);
  const todasPalavrasGenericas = palavras.length > 0 && palavras.every(palavra =>
    tiposGenericos.some(generico => generico === palavra)
  );

  const isGeneric = isCompletelyGeneric || todasPalavrasGenericas;

  if (isGeneric) {
    logProductMapping('TIPO_GENERICO_DETECTADO', { 
      tipo,
      tipoNormalizado,
      palavras,
      motivo: isCompletelyGeneric ? 'completamente_generico' : 'todas_palavras_genericas',
      source: 'generic_detection_aprimorado'
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