// Busca por similaridade no banco de dados usando Levenshtein Distance
import { supabase } from '@/integrations/supabase/client';
import { buscarProdutoPai, normalizarParaMatching } from './productUtils';

interface DatabaseSimilarityMatch {
  id: string;
  produto: string;
  nome_base?: string;
  nome_variacao?: string;
  produto_pai_id?: string;
  similarity: number;
  matchType: 'exact' | 'similarity' | 'partial';
}

// Calcula distância Levenshtein otimizada
function levenshteinDistance(str1: string, str2: string): number {
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;
  
  // Otimização: se strings são muito diferentes em tamanho, retorna logo
  if (Math.abs(str1.length - str2.length) > Math.max(str1.length, str2.length) * 0.5) {
    return Math.max(str1.length, str2.length);
  }
  
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
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
  
  return matrix[str2.length][str1.length];
}

// Calcula similaridade percentual
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizarParaMatching(str1);
  const normalized2 = normalizarParaMatching(str2);
  
  // Exact match
  if (normalized1 === normalized2) return 100;
  
  // Contains match - alta confiança
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const minLen = Math.min(normalized1.length, normalized2.length);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    return Math.max(85, 100 - ((maxLen - minLen) * 3));
  }
  
  // Levenshtein distance
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  if (distance > maxLength * 0.3) return 0; // Muito diferente
  
  let similarity = ((maxLength - distance) / maxLength) * 100;
  
  // Bonus para início similar (comum em erros de digitação)
  if (normalized1.substring(0, 3) === normalized2.substring(0, 3) && maxLength >= 4) {
    similarity += 5;
  }
  
  return Math.max(0, Math.min(100, similarity));
}

// Busca produtos no banco com tolerância a erros
export async function findSimilarProductsInDatabase(
  searchTerm: string,
  minSimilarity: number = 85
): Promise<DatabaseSimilarityMatch[]> {
  try {
    console.log(`🔍 [DB Similarity] Buscando produtos similares a: "${searchTerm}"`);
    
    // Buscar todos os produtos ativos no banco
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('id, produto, nome_base, nome_variacao, produto_pai_id')
      .eq('ativo', true);
    
    if (error) {
      console.error('❌ [DB Similarity] Erro ao buscar produtos:', error);
      return [];
    }
    
    if (!produtos || produtos.length === 0) {
      console.log('⚠️ [DB Similarity] Nenhum produto encontrado no banco');
      return [];
    }
    
    const matches: DatabaseSimilarityMatch[] = [];
    const normalizedSearch = normalizarParaMatching(searchTerm);
    
    console.log(`📊 [DB Similarity] Analisando ${produtos.length} produtos...`);
    
    for (const produto of produtos) {
      // Campos para comparar
      const fieldsToCompare = [
        { field: produto.produto, type: 'produto' as const },
        { field: produto.nome_base, type: 'nome_base' as const },
        { field: produto.nome_variacao, type: 'nome_variacao' as const }
      ].filter(item => item.field && typeof item.field === 'string');
      
      for (const { field, type } of fieldsToCompare) {
        const similarity = calculateSimilarity(normalizedSearch, field);
        
        if (similarity >= minSimilarity) {
          // Determinar tipo de match
          let matchType: 'exact' | 'similarity' | 'partial' = 'similarity';
          if (similarity === 100) matchType = 'exact';
          else if (similarity >= 95) matchType = 'similarity';
          else matchType = 'partial';
          
          // Construir nome do produto baseado na estrutura pai/variação
          let nomeProduto = produto.produto || '';
          
          // Se é uma variação, construir nome completo
          if (produto.produto_pai_id && produto.nome_base && produto.nome_variacao) {
            nomeProduto = `${produto.nome_base} ${produto.nome_variacao}`.trim();
          }
          
          matches.push({
            id: produto.id,
            produto: nomeProduto,
            nome_base: produto.nome_base,
            nome_variacao: produto.nome_variacao,
            produto_pai_id: produto.produto_pai_id,
            similarity,
            matchType
          });
          
          console.log(`✅ [DB Similarity] Match encontrado: "${field}" → "${nomeProduto}" (${similarity.toFixed(1)}% - ${type})`);
        }
      }
    }
    
    // Ordenar por similaridade (maior primeiro) e depois por tipo de match
    const sortedMatches = matches.sort((a, b) => {
      // Prioridade: exact > similarity > partial
      const typeOrder = { exact: 3, similarity: 2, partial: 1 };
      if (typeOrder[a.matchType] !== typeOrder[b.matchType]) {
        return typeOrder[b.matchType] - typeOrder[a.matchType];
      }
      return b.similarity - a.similarity;
    });
    
    console.log(`🎯 [DB Similarity] ${sortedMatches.length} matches encontrados com similaridade >= ${minSimilarity}%`);
    
    return sortedMatches.slice(0, 10); // Limitar a 10 melhores matches
    
  } catch (error) {
    console.error('❌ [DB Similarity] Erro na busca por similaridade:', error);
    return [];
  }
}

// Busca otimizada para encontrar o melhor match no banco
export async function findBestDatabaseMatch(
  searchTerm: string
): Promise<DatabaseSimilarityMatch | null> {
  const matches = await findSimilarProductsInDatabase(searchTerm, 85);
  
  if (matches.length === 0) {
    console.log(`❌ [DB Similarity] Nenhum match encontrado para: "${searchTerm}"`);
    return null;
  }
  
  const bestMatch = matches[0];
  console.log(`🏆 [DB Similarity] Melhor match: "${searchTerm}" → "${bestMatch.produto}" (${bestMatch.similarity.toFixed(1)}%)`);
  
  return bestMatch;
}