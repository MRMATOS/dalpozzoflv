import { supabase } from '@/integrations/supabase/client';
import { findBestDatabaseMatch, type DatabaseSimilarityMatch } from '@/utils/productExtraction/databaseSimilarity';
import { normalizarParaMatching } from '@/utils/productExtraction/productUtils';

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

// Calcula similaridade entre duas strings usando algoritmo otimizado
const calcularSimilaridade = (str1: string, str2: string): number => {
  const normalized1 = normalizarParaMatching(str1);
  const normalized2 = normalizarParaMatching(str2);
  
  if (normalized1 === normalized2) return 1.0;
  if (normalized1.length === 0 || normalized2.length === 0) return 0.0;
  
  // Verifica inclusão de substring com score melhorado
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const minLen = Math.min(normalized1.length, normalized2.length);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    return Math.max(0.85, 1.0 - ((maxLen - minLen) * 0.03));
  }
  
  // Levenshtein otimizado
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  // Early return para strings muito diferentes
  if (Math.abs(normalized1.length - normalized2.length) > maxLength * 0.5) {
    return 0.0;
  }
  
  const matrix = Array(normalized2.length + 1).fill(null).map(() => Array(normalized1.length + 1).fill(null));
  
  for (let i = 0; i <= normalized1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= normalized2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= normalized2.length; j++) {
    for (let i = 1; i <= normalized1.length; i++) {
      if (normalized1[i - 1] === normalized2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  
  const distance = matrix[normalized2.length][normalized1.length];
  let similarity = 1 - (distance / maxLength);
  
  // Bonus para início similar (padrão comum em erros de digitação)
  if (normalized1.substring(0, 3) === normalized2.substring(0, 3) && maxLength >= 4) {
    similarity += 0.05;
  }
  
  return Math.max(0, Math.min(1, similarity));
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

// Normaliza nomes para comparação (usando função otimizada)
const normalizarNome = (nome: string): string => {
  return normalizarParaMatching(nome);
};

// Refina identificação do produto consultando o banco com busca inteligente
export const refinarIdentificacaoProduto = async (
  produtoBase: string, 
  tipoIdentificado: string, 
  linhaOriginal: string
): Promise<RefinementResult | null> => {
  try {
    console.log(`🔄 [Refinamento] Iniciando busca inteligente para: "${produtoBase}" tipo: "${tipoIdentificado}"`);
    console.log(`📝 [Refinamento] Linha original: "${linhaOriginal}"`);
    
    // ETAPA 1: Busca inteligente no banco usando novo sistema de similaridade
    const bestDatabaseMatch = await findBestDatabaseMatch(produtoBase);
    
    if (bestDatabaseMatch && bestDatabaseMatch.similarity >= 85) {
      console.log(`✅ [Refinamento] Match inteligente encontrado: "${bestDatabaseMatch.produto}" (${bestDatabaseMatch.similarity.toFixed(1)}%)`);
      
      // Se encontrou um produto pai, buscar variação específica
      if (bestDatabaseMatch.produto_pai_id || bestDatabaseMatch.nome_variacao) {
        console.log(`🔍 [Refinamento] Refinando variação para: "${tipoIdentificado}"`);
        
        // Buscar outras variações do mesmo produto pai
        const { data: variacoes, error } = await supabase
          .from('produtos')
          .select('id, produto, nome_base, nome_variacao')
          .eq('ativo', true)
          .eq('produto_pai_id', bestDatabaseMatch.produto_pai_id || bestDatabaseMatch.id);
        
        if (!error && variacoes && variacoes.length > 0) {
          console.log(`📋 [Refinamento] ${variacoes.length} variações encontradas`);
          
          // Encontrar melhor variação usando algoritmo otimizado
          let melhorVariacao: { produto: any; score: number } | null = null;
          const tipoNorm = normalizarParaMatching(tipoIdentificado);
          
          for (const variacao of variacoes) {
            if (!variacao.nome_variacao) continue;
            
            const variacaoNorm = normalizarParaMatching(variacao.nome_variacao);
            let score = calcularSimilaridade(variacaoNorm, tipoNorm);
            
            // Bonus por termos da linha original
            const termosLinha = extrairTermosRelevantes(linhaOriginal);
            for (const termo of termosLinha) {
              if (variacaoNorm.includes(normalizarParaMatching(termo))) {
                score += 0.05;
              }
            }
            
            // Verifica se a variação aparece na linha original
            if (normalizarParaMatching(linhaOriginal).includes(variacaoNorm)) {
              score += 0.15;
            }
            
            if (score > (melhorVariacao?.score || 0.75)) {
              melhorVariacao = { produto: variacao, score: Math.min(score, 1.0) };
            }
          }
          
          // Se encontrou uma boa variação, usar ela
          if (melhorVariacao && melhorVariacao.score > 0.75) {
            console.log(`🎯 [Refinamento] Variação específica encontrada: "${melhorVariacao.produto.nome_variacao}" (${(melhorVariacao.score * 100).toFixed(1)}%)`);
            
            return {
              produtoId: melhorVariacao.produto.id,
              produto: melhorVariacao.produto.nome_base || melhorVariacao.produto.produto || produtoBase,
              tipo: melhorVariacao.produto.nome_variacao || tipoIdentificado,
              confianca: melhorVariacao.score,
              fonte: melhorVariacao.score > 0.95 ? 'exato' : 'similar'
            };
          }
        }
      }
      
      // Se não encontrou variação específica, usar o match direto do banco
      const confidenceFinal = bestDatabaseMatch.similarity / 100;
      console.log(`📦 [Refinamento] Usando produto encontrado: "${bestDatabaseMatch.produto}" (${bestDatabaseMatch.similarity.toFixed(1)}%)`);
      
      return {
        produtoId: bestDatabaseMatch.id,
        produto: bestDatabaseMatch.nome_base || bestDatabaseMatch.produto || produtoBase,
        tipo: bestDatabaseMatch.nome_variacao || tipoIdentificado,
        confianca: confidenceFinal,
        fonte: bestDatabaseMatch.matchType === 'exact' ? 'exato' : 'similar'
      };
    }
    
    // ETAPA 2: Fallback para busca tradicional se sistema inteligente falhou
    console.log(`⚠️ [Refinamento] Sistema inteligente não encontrou match suficiente, usando busca tradicional...`);
    
    const produtos = await carregarProdutosBanco();
    const termosLinha = extrairTermosRelevantes(linhaOriginal);
    const produtoBaseNorm = normalizarNome(produtoBase);
    const tipoNorm = normalizarNome(tipoIdentificado);
    
    // Busca por match da base com threshold mais baixo
    const produtosBase = produtos.filter(p => {
      const nomeBaseNorm = normalizarNome(p.nome_base || p.produto || '');
      return calcularSimilaridade(nomeBaseNorm, produtoBaseNorm) > 0.8; // Threshold reduzido
    });
    
    if (produtosBase.length === 0) {
      console.log(`❌ [Refinamento] Nenhum produto encontrado para "${produtoBase}"`);
      return null;
    }
    
    console.log(`📋 [Refinamento] ${produtosBase.length} produtos similares encontrados na busca tradicional`);
    
    // Busca variação específica
    let melhorMatch: { produto: ProdutoBanco; score: number } | null = null;
    
    for (const produto of produtosBase) {
      if (!produto.nome_variacao) continue;
      
      const variacaoNorm = normalizarNome(produto.nome_variacao);
      let score = calcularSimilaridade(variacaoNorm, tipoNorm);
      
      // Bonus por termos encontrados
      for (const termo of termosLinha) {
        if (variacaoNorm.includes(normalizarParaMatching(termo))) {
          score += 0.05;
        }
      }
      
      if (score > (melhorMatch?.score || 0.7)) { // Threshold reduzido
        melhorMatch = { produto, score: Math.min(score, 1.0) };
      }
    }
    
    // Retorna melhor match ou produto base
    if (melhorMatch && melhorMatch.score > 0.7) {
      console.log(`✅ [Refinamento] Variação tradicional encontrada: "${melhorMatch.produto.nome_variacao}" (${(melhorMatch.score * 100).toFixed(1)}%)`);
      return {
        produtoId: melhorMatch.produto.id,
        produto: melhorMatch.produto.nome_base || melhorMatch.produto.produto || produtoBase,
        tipo: melhorMatch.produto.nome_variacao || tipoIdentificado,
        confianca: melhorMatch.score,
        fonte: melhorMatch.score > 0.95 ? 'exato' : 'similar'
      };
    }
    
    // Fallback final - produto base
    const produtoBasePrincipal = produtosBase[0];
    const scoreBase = calcularSimilaridade(
      normalizarNome(produtoBasePrincipal.nome_base || produtoBasePrincipal.produto || ''),
      produtoBaseNorm
    );
    
    console.log(`🔄 [Refinamento] Usando produto base: "${produtoBasePrincipal.nome_base || produtoBasePrincipal.produto}" (${(scoreBase * 100).toFixed(1)}%)`);
    
    return {
      produtoId: produtoBasePrincipal.id,
      produto: produtoBasePrincipal.nome_base || produtoBasePrincipal.produto || produtoBase,
      tipo: tipoIdentificado,
      confianca: scoreBase,
      fonte: 'base'
    };
    
  } catch (error) {
    console.error('❌ [Refinement] Erro no refinamento:', error);
    return null;
  }
};

// Limpa cache quando necessário
export const limparCacheRefinamento = (): void => {
  produtosBancoCache = null;
  console.log('🧹 [Refinamento] Cache de refinamento limpo');
};