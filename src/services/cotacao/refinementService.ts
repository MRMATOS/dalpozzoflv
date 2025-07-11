import { supabase } from '@/integrations/supabase/client';

interface ProdutoBanco {
  id: string;
  produto: string;
  nome_base: string | null;
  nome_variacao: string | null;
}

interface RefinementResult {
  produtoId: string;
  produto: string;
  tipo: string;
  confianca: number;
  fonte: 'exato' | 'similar' | 'base';
}

// Cache para produtos do banco
let produtosBancoCache: ProdutoBanco[] | null = null;

// Carrega produtos do banco com cache
const carregarProdutosBanco = async (): Promise<ProdutoBanco[]> => {
  if (produtosBancoCache) {
    return produtosBancoCache;
  }

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, produto, nome_base, nome_variacao')
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
    }

    produtosBancoCache = data || [];
    console.log(`Refinamento: ${produtosBancoCache.length} produtos carregados para matching.`);
    return produtosBancoCache;
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    return [];
  }
};

// Calcula similaridade entre duas strings usando Levenshtein modificado
const calcularSimilaridade = (str1: string, str2: string): number => {
  str1 = str1.toLowerCase().trim();
  str2 = str2.toLowerCase().trim();
  
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;
  
  // Jaro-Winkler simplificado para produtos FLV
  const maxLength = Math.max(str1.length, str2.length);
  const minLength = Math.min(str1.length, str2.length);
  
  // Penaliza diferenças de tamanho muito grandes
  if (maxLength / minLength > 3) return 0.0;
  
  // Verifica inclusão de substring
  if (str1.includes(str2) || str2.includes(str1)) {
    return 0.7 + (minLength / maxLength) * 0.3;
  }
  
  // Levenshtein distance básico
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + cost  // substitution
      );
    }
  }
  
  const distance = matrix[str2.length][str1.length];
  return 1 - (distance / maxLength);
};

// Extrai termos relevantes da linha para matching
const extrairTermosRelevantes = (linha: string): string[] => {
  // Remove preços, números e caracteres especiais
  const linhaSemPreco = linha.replace(/\d+[.,]\d+/g, '').replace(/\d+/g, '');
  const termos = linhaSemPreco.toLowerCase()
    .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, ' ')
    .split(/\s+/)
    .filter(termo => termo.length > 2)
    .filter(termo => !['para', 'com', 'sem', 'tipo', 'especial'].includes(termo));
  
  return termos;
};

// Normaliza nomes para comparação
const normalizarNome = (nome: string): string => {
  return nome.toLowerCase()
    .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Refina identificação do produto consultando o banco
export const refinarIdentificacaoProduto = async (
  produtoBase: string, 
  tipoIdentificado: string, 
  linhaOriginal: string
): Promise<RefinementResult | null> => {
  try {
    const produtos = await carregarProdutosBanco();
    const termosLinha = extrairTermosRelevantes(linhaOriginal);
    const produtoBaseNorm = normalizarNome(produtoBase);
    const tipoNorm = normalizarNome(tipoIdentificado);
    
    console.log(`Refinamento: Buscando variações para "${produtoBase}" com tipo "${tipoIdentificado}"`);
    console.log(`Termos extraídos: ${termosLinha.join(', ')}`);
    
    // 1. Busca por match exato da base
    const produtosBase = produtos.filter(p => {
      const nomeBaseNorm = normalizarNome(p.nome_base || p.produto || '');
      return nomeBaseNorm === produtoBaseNorm || 
             calcularSimilaridade(nomeBaseNorm, produtoBaseNorm) > 0.9;
    });
    
    if (produtosBase.length === 0) {
      console.log(`Refinamento: Nenhum produto base encontrado para "${produtoBase}"`);
      return null;
    }
    
    console.log(`Refinamento: ${produtosBase.length} produtos base encontrados`);
    
    // 2. Busca variação específica
    let melhorMatch: { produto: ProdutoBanco; score: number } | null = null;
    
    for (const produto of produtosBase) {
      if (!produto.nome_variacao) continue;
      
      const variacaoNorm = normalizarNome(produto.nome_variacao);
      
      // Score baseado na similaridade com o tipo identificado
      let score = calcularSimilaridade(variacaoNorm, tipoNorm);
      
      // Bonus por termos encontrados na variação
      for (const termo of termosLinha) {
        if (variacaoNorm.includes(termo)) {
          score += 0.1;
        }
      }
      
      // Bonus por termos encontrados na linha original
      for (const termo of termosLinha) {
        if (linhaOriginal.toLowerCase().includes(variacaoNorm)) {
          score += 0.2;
        }
      }
      
      if (score > (melhorMatch?.score || 0.6)) {
        melhorMatch = { produto, score: Math.min(score, 1.0) };
      }
    }
    
    // 3. Retorna melhor match ou produto base padrão
    if (melhorMatch && melhorMatch.score > 0.7) {
      console.log(`Refinamento: Match específico encontrado - ${melhorMatch.produto.nome_variacao} (score: ${melhorMatch.score.toFixed(2)})`);
      return {
        produtoId: melhorMatch.produto.id,
        produto: melhorMatch.produto.nome_base || melhorMatch.produto.produto || produtoBase,
        tipo: melhorMatch.produto.nome_variacao || tipoIdentificado,
        confianca: melhorMatch.score,
        fonte: melhorMatch.score > 0.95 ? 'exato' : 'similar'
      };
    }
    
    // Fallback para produto base com melhor variação genérica
    const produtoBasePrincipal = produtosBase[0];
    const scoreBase = 0.8; // Score médio para produto base identificado
    
    console.log(`Refinamento: Usando produto base - ${produtoBasePrincipal.nome_base || produtoBasePrincipal.produto}`);
    return {
      produtoId: produtoBasePrincipal.id,
      produto: produtoBasePrincipal.nome_base || produtoBasePrincipal.produto || produtoBase,
      tipo: tipoIdentificado, // Mantém o tipo do dicionário
      confianca: scoreBase,
      fonte: 'base'
    };
    
  } catch (error) {
    console.error('Erro no refinamento:', error);
    return null;
  }
};

// Limpa cache quando necessário
export const limparCacheRefinamento = (): void => {
  produtosBancoCache = null;
  console.log('Cache de refinamento limpo');
};