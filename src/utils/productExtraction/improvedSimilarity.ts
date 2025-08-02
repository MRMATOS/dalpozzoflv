// ========================================
// FASE 2: FUNÇÃO DE SIMILARIDADE CORRIGIDA
// ========================================
// Sistema robusto com validações rigorosas e blacklist semântica

import { normalizarParaMatching } from './productUtils';

// Blacklist semântica - produtos que NUNCA devem ser confundidos
const SEMANTIC_BLACKLIST: Record<string, string[]> = {
  // Frutas que não devem virar vegetais
  'caqui': ['cenoura', 'batata', 'cebola', 'alho', 'beterraba'],
  'kiwi': ['alho', 'cebola', 'batata'],
  'banana': ['cenoura', 'batata', 'mandioca'],
  'maca': ['batata', 'cebola', 'alho'],
  'laranja': ['cenoura', 'batata', 'abobora'],
  'melao': ['cebola', 'alho', 'batata'],
  
  // Vegetais que não devem virar frutas
  'cenoura': ['caqui', 'kiwi', 'banana', 'maca', 'laranja', 'melao', 'mamao'],
  'brocolis': ['banana', 'maca', 'laranja', 'uva'],
  'berinjela': ['banana', 'maca', 'laranja', 'uva'],
  'chuchu': ['banana', 'maca', 'laranja', 'uva'],
  'couve': ['banana', 'maca', 'laranja', 'uva'],
  'vagem': ['banana', 'maca', 'laranja', 'uva'],
  'agriao': ['banana', 'maca', 'laranja', 'uva'],
  'acelga': ['banana', 'maca', 'laranja', 'uva'],
  'selga': ['banana', 'maca', 'laranja', 'uva'],
  
  // Temperos que não devem virar outras coisas
  'hortela': ['cenoura', 'batata', 'banana', 'maca'],
  'alho': ['kiwi', 'banana', 'maca', 'caqui'],
  'cebola': ['banana', 'maca', 'caqui', 'kiwi']
};

// Categorias semânticas para validação
const CATEGORIAS_SEMANTICAS = {
  frutas: ['banana', 'maca', 'laranja', 'limao', 'kiwi', 'caqui', 'melao', 'mamao', 'uva', 'manga'],
  vegetais: ['cenoura', 'batata', 'brocolis', 'berinjela', 'chuchu', 'couve', 'vagem', 'beterraba'],
  verduras: ['agriao', 'acelga', 'selga', 'alface', 'rucula', 'espinafre'],
  temperos: ['hortela', 'manjericao', 'salsinha', 'cebolinha'],
  tuberculos: ['batata', 'mandioca', 'inhame', 'cara'],
  alliums: ['alho', 'cebola', 'cebolinha', 'alho-poro']
};

// Função para detectar categoria semântica
const detectarCategoria = (produto: string): string | null => {
  const produtoNorm = normalizarParaMatching(produto);
  
  for (const [categoria, produtos] of Object.entries(CATEGORIAS_SEMANTICAS)) {
    if (produtos.some(p => produtoNorm.includes(normalizarParaMatching(p)))) {
      return categoria;
    }
  }
  return null;
};

// Função para verificar se dois produtos estão na blacklist
const isBlacklisted = (produto1: string, produto2: string): boolean => {
  const prod1Norm = normalizarParaMatching(produto1);
  const prod2Norm = normalizarParaMatching(produto2);
  
  // Verificar blacklist direta
  for (const [produto, blacklist] of Object.entries(SEMANTIC_BLACKLIST)) {
    const produtoNorm = normalizarParaMatching(produto);
    
    // Se produto1 está na blacklist de produto2 ou vice-versa
    if ((prod1Norm.includes(produtoNorm) && blacklist.some(b => prod2Norm.includes(normalizarParaMatching(b)))) ||
        (prod2Norm.includes(produtoNorm) && blacklist.some(b => prod1Norm.includes(normalizarParaMatching(b))))) {
      return true;
    }
  }
  
  return false;
};

// Função para validação semântica por categoria
const isSemanticallySimilar = (produto1: string, produto2: string): boolean => {
  const cat1 = detectarCategoria(produto1);
  const cat2 = detectarCategoria(produto2);
  
  // Se não conseguimos detectar categoria, ser conservador
  if (!cat1 || !cat2) return false;
  
  // Mesma categoria = OK
  if (cat1 === cat2) return true;
  
  // Categorias relacionadas permitidas
  const categoriasSimilares: Record<string, string[]> = {
    'verduras': ['vegetais', 'temperos'],
    'vegetais': ['verduras', 'tuberculos'],
    'temperos': ['verduras'],
    'tuberculos': ['vegetais'],
    'alliums': ['temperos', 'vegetais']
  };
  
  return categoriasSimilares[cat1]?.includes(cat2) || categoriasSimilares[cat2]?.includes(cat1) || false;
};

// Algoritmo Levenshtein otimizado
const levenshteinDistance = (str1: string, str2: string): number => {
  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;
  
  // Early return para strings muito diferentes
  const lengthDiff = Math.abs(str1.length - str2.length);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (lengthDiff > maxLength * 0.6) {
    return maxLength; // Máxima distância
  }
  
  // Matriz de programação dinâmica
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
};

// Threshold dinâmico baseado no tamanho e tipo
const getThresholdDinamico = (str1: string, str2: string): number => {
  const minLength = Math.min(str1.length, str2.length);
  const maxLength = Math.max(str1.length, str2.length);
  
  // Palavras muito curtas precisam ser quase idênticas
  if (maxLength <= 4) return 0.95;
  
  // Palavras médias podem ter mais tolerância
  if (maxLength <= 8) return 0.85;
  
  // Palavras longas podem ter ainda mais tolerância
  return 0.75;
};

// FUNÇÃO PRINCIPAL DE SIMILARIDADE CORRIGIDA
export const calcularSimilaridadeCorrigida = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;
  
  const normalized1 = normalizarParaMatching(str1);
  const normalized2 = normalizarParaMatching(str2);
  
  // Validação básica
  if (normalized1 === normalized2) return 1.0;
  if (normalized1.length === 0 || normalized2.length === 0) return 0;
  
  // ⚠️ VALIDAÇÃO SEMÂNTICA RIGOROSA - BLACKLIST
  if (isBlacklisted(str1, str2)) {
    console.log(`🚫 [Similarity] BLACKLIST: "${str1}" ↔ "${str2}" - associação proibida`);
    return 0; // Score ZERO para associações proibidas
  }
  
  // ⚠️ VALIDAÇÃO SEMÂNTICA POR CATEGORIA
  if (!isSemanticallySimilar(str1, str2)) {
    console.log(`🚫 [Similarity] CATEGORIA: "${str1}" ↔ "${str2}" - categorias incompatíveis`);
    return 0; // Score ZERO para categorias incompatíveis
  }
  
  // Threshold dinâmico
  const thresholdMinimo = getThresholdDinamico(normalized1, normalized2);
  
  // Match por inclusão (mais rigoroso)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    const minLen = Math.min(normalized1.length, normalized2.length);
    const maxLen = Math.max(normalized1.length, normalized2.length);
    
    // Se diferença for muito grande, penalizar
    const diffRatio = (maxLen - minLen) / maxLen;
    if (diffRatio > 0.5) {
      console.log(`⚠️ [Similarity] INCLUDE: "${str1}" ↔ "${str2}" - diferença muito grande (${(diffRatio * 100).toFixed(1)}%)`);
      return Math.max(0.3, 0.9 - diffRatio); // Score baixo mas não zero
    }
    
    const includeScore = Math.max(0.8, 1.0 - (diffRatio * 0.5));
    console.log(`✅ [Similarity] INCLUDE: "${str1}" ↔ "${str2}" - score: ${includeScore.toFixed(3)}`);
    return includeScore;
  }
  
  // Levenshtein com validações
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  // Se distância for muito grande, rejeitar
  if (distance > maxLength * 0.4) {
    console.log(`❌ [Similarity] DISTANCE: "${str1}" ↔ "${str2}" - distância muito grande (${distance}/${maxLength})`);
    return 0;
  }
  
  let similarity = 1 - (distance / maxLength);
  
  // Bonus conservador para início similar (apenas para palavras >= 5 chars)
  if (maxLength >= 5 && normalized1.substring(0, 3) === normalized2.substring(0, 3)) {
    similarity += 0.05; // Bonus reduzido de 0.1 para 0.05
  }
  
  // Aplicar threshold dinâmico
  const finalScore = similarity >= thresholdMinimo ? similarity : 0;
  
  if (finalScore > 0) {
    console.log(`✅ [Similarity] LEVENSHTEIN: "${str1}" ↔ "${str2}" - score: ${finalScore.toFixed(3)} (threshold: ${thresholdMinimo.toFixed(3)})`);
  } else {
    console.log(`❌ [Similarity] THRESHOLD: "${str1}" ↔ "${str2}" - score ${similarity.toFixed(3)} < threshold ${thresholdMinimo.toFixed(3)}`);
  }
  
  return Math.max(0, Math.min(1, finalScore));
};

// Função para testar validação semântica
export const testarValidacaoSemantica = (produto1: string, produto2: string): {
  blacklisted: boolean;
  semanticallySimilar: boolean;
  categoria1: string | null;
  categoria2: string | null;
} => {
  return {
    blacklisted: isBlacklisted(produto1, produto2),
    semanticallySimilar: isSemanticallySimilar(produto1, produto2),
    categoria1: detectarCategoria(produto1),
    categoria2: detectarCategoria(produto2)
  };
};

// Função para adicionar produto à blacklist dinamicamente
export const adicionarABlacklist = (produto: string, produtosProibidos: string[]): void => {
  const produtoNorm = normalizarParaMatching(produto);
  if (!SEMANTIC_BLACKLIST[produtoNorm]) {
    SEMANTIC_BLACKLIST[produtoNorm] = [];
  }
  
  produtosProibidos.forEach(proibido => {
    const proibidoNorm = normalizarParaMatching(proibido);
    if (!SEMANTIC_BLACKLIST[produtoNorm].includes(proibidoNorm)) {
      SEMANTIC_BLACKLIST[produtoNorm].push(proibidoNorm);
    }
  });
  
  console.log(`📝 [Blacklist] Adicionado: ${produto} -> [${produtosProibidos.join(', ')}]`);
};

// Função para listar problemas na blacklist atual
export const auditarBlacklist = (): { produto: string; blacklist: string[] }[] => {
  return Object.entries(SEMANTIC_BLACKLIST).map(([produto, blacklist]) => ({
    produto,
    blacklist
  }));
};