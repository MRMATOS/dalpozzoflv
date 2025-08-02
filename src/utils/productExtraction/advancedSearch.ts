// Busca avançada com tolerância a erros de digitação
// Implementa algoritmo de distância Levenshtein para identificar produtos similares

interface SimilarityMatch {
  produto: string;
  tipo: string;
  confidence: number;
  original: string;
}

// Calcula distância Levenshtein entre duas strings
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
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

// Normaliza texto removendo acentos e caracteres especiais
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Remove espaços extras
    .trim();
}

// Calcula similaridade percentual entre duas strings com algoritmo otimizado
function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  // Exact match - máxima confiança
  if (normalized1 === normalized2) return 100;
  
  // Palavras-chave importantes - alta confiança
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const shorterLength = Math.min(normalized1.length, normalized2.length);
    const longerLength = Math.max(normalized1.length, normalized2.length);
    
    // Se uma string está contida na outra com diferença pequena, alta similaridade
    if (longerLength - shorterLength <= 2) return 95;
    
    // Senão, boa similaridade baseada na proporção
    return Math.max(80, 100 - ((longerLength - shorterLength) * 5));
  }
  
  // Levenshtein distance com threshold otimizado
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  // Se distância é muito grande, não vale a pena calcular
  if (distance > maxLength * 0.4) return 0;
  
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  // Bonus para palavras que começam igual (padrão comum em digitação)
  let bonus = 0;
  if (normalized1.substring(0, 3) === normalized2.substring(0, 3) && maxLength >= 4) {
    bonus = 10;
  }
  
  return Math.max(0, Math.min(100, similarity + bonus));
}

// Busca inteligente considerando erros de digitação com threshold otimizado
export function findSimilarProducts(
  searchTerm: string,
  dicionario: Record<string, Record<string, string[]>>,
  minSimilarity: number = 85 // Increased threshold for better precision
): SimilarityMatch[] {
  const matches: SimilarityMatch[] = [];
  const normalizedSearch = normalizeText(searchTerm);
  
  // Early return se termo é muito curto
  if (normalizedSearch.length < 2) return matches;
  
  for (const [produto, variacoes] of Object.entries(dicionario)) {
    for (const [tipo, sinonimos] of Object.entries(variacoes)) {
      for (const sinonimo of sinonimos) {
        const similarity = calculateSimilarity(normalizedSearch, sinonimo);
        
        if (similarity >= minSimilarity) {
          matches.push({
            produto,
            tipo,
            confidence: similarity,
            original: sinonimo
          });
        }
      }
    }
  }
  
  // Ordenar por confiança (maior primeiro) e depois por comprimento do original (menor primeiro)
  return matches.sort((a, b) => {
    if (Math.abs(a.confidence - b.confidence) < 1) {
      return a.original.length - b.original.length; // Preferir matches mais curtos
    }
    return b.confidence - a.confidence;
  });
}

// Busca contextual para detectar padrões específicos
export function contextualSearch(linha: string): {
  produto?: string;
  tipo?: string;
  peso?: string;
  preco?: string;
} {
  const normalizedLine = normalizeText(linha);
  
  // Padrões comuns para extração contextual
  const patterns = {
    // Produto + peso: "abacaxi 20kg", "cheiro verde kg"
    produtoComPeso: /([a-z\s-]+)\s*([\d,]+)?\s*(kg|k|quilo)/i,
    
    // Havaí variations: "havaí", "havai", "hawai", "hawaii"
    havai: /(hava[íi]|hawa[íi]|hawaii?)/i,
    
    // Cheiro verde variations
    cheiroVerde: /(cheiro[\s-]?verde?|tempero[\s-]?verde?)/i,
    
    // Preço patterns: "R$ 45,00", "45.00", "45,50"
    preco: /(?:r\$?\s*)?(\d+[.,]\d{2})/i
  };
  
  const result: any = {};
  
  // Detectar havaí com tolerância a erros
  if (patterns.havai.test(normalizedLine)) {
    result.produto = 'abacaxi';
    result.tipo = 'havaí';
  }
  
  // Detectar cheiro verde com tolerância a erros
  if (patterns.cheiroVerde.test(normalizedLine)) {
    result.produto = 'cheiro-verde';
    result.tipo = 'tradicional';
  }
  
  // Extrair preço
  const precoMatch = linha.match(patterns.preco);
  if (precoMatch) {
    result.preco = precoMatch[1].replace(',', '.');
  }
  
  return result;
}

// Cache para melhorar performance de buscas repetidas
class SearchCache {
  private cache = new Map<string, SimilarityMatch[]>();
  private maxSize = 1000;
  
  get(key: string): SimilarityMatch[] | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, value: SimilarityMatch[]): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const searchCache = new SearchCache();

// Função principal de busca inteligente com priorização otimizada
export function intelligentProductSearch(
  searchTerm: string,
  dicionario: Record<string, Record<string, string[]>>
): SimilarityMatch | null {
  // Verificar cache primeiro
  const cacheKey = normalizeText(searchTerm);
  let cached = searchCache.get(cacheKey);
  
  if (!cached) {
    // Busca contextual primeiro (alta precisão)
    const contextual = contextualSearch(searchTerm);
    if (contextual.produto && contextual.tipo) {
      return {
        produto: contextual.produto,
        tipo: contextual.tipo,
        confidence: 95,
        original: searchTerm
      };
    }
    
    // Busca por similaridade com threshold elevado para maior precisão
    cached = findSimilarProducts(searchTerm, dicionario, 85);
    searchCache.set(cacheKey, cached);
  }
  
  // Retornar apenas se a confiança for suficientemente alta
  return cached.length > 0 && cached[0].confidence >= 85 ? cached[0] : null;
}