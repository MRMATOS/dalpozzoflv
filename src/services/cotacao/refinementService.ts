import { supabase } from '@/integrations/supabase/client';
// import { findBestDatabaseMatch, type DatabaseSimilarityMatch } from '@/utils/productExtraction/databaseSimilarity';
import { normalizarParaMatching } from '@/utils/productExtraction/productUtils';
import { calcularSimilaridadeCorrigida, testarValidacaoSemantica } from '@/utils/productExtraction/improvedSimilarity';

// ⚠️ ROLLBACK CONTROLADO - FASE 1 + FASE 2
// Sistema de similaridade inteligente temporariamente desabilitado
// Função de similaridade CORRIGIDA implementada
const INTELLIGENT_SIMILARITY_ENABLED = false;
const DEBUG_ASSOCIATIONS = true;

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

// ⚠️ FUNÇÃO DE SIMILARIDADE ANTIGA SUBSTITUÍDA
// Agora usa a função corrigida com validações rigorosas
const calcularSimilaridade = (str1: string, str2: string): number => {
  return calcularSimilaridadeCorrigida(str1, str2);
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

// Função auxiliar para logging de associações
const logAssociation = (step: string, data: any) => {
  if (DEBUG_ASSOCIATIONS) {
    console.log(`🔍 [DEBUG-ASSOC] ${step}:`, data);
  }
};

// Refina identificação do produto usando busca tradicional controlada
export const refinarIdentificacaoProduto = async (
  produtoBase: string, 
  tipoIdentificado: string, 
  linhaOriginal: string
): Promise<RefinementResult | null> => {
  try {
    logAssociation('INICIO_REFINAMENTO', {
      produtoBase,
      tipoIdentificado,
      linhaOriginal,
      sistemaInteligente: INTELLIGENT_SIMILARITY_ENABLED
    });
    
    console.log(`🔄 [Refinamento] Iniciando busca tradicional para: "${produtoBase}" tipo: "${tipoIdentificado}"`);
    console.log(`📝 [Refinamento] Linha original: "${linhaOriginal}"`);
    
    // SISTEMA INTELIGENTE DESABILITADO - PULAR PARA BUSCA TRADICIONAL
    if (INTELLIGENT_SIMILARITY_ENABLED) {
      // Este código está temporariamente desabilitado
      console.log(`⚠️ [Refinamento] Sistema inteligente desabilitado - usando apenas busca tradicional`);
    }
    
    // BUSCA TRADICIONAL CONTROLADA
    const produtos = await carregarProdutosBanco();
    const termosLinha = extrairTermosRelevantes(linhaOriginal);
    const produtoBaseNorm = normalizarNome(produtoBase);
    const tipoNorm = normalizarNome(tipoIdentificado);
    
    logAssociation('PRODUTOS_CARREGADOS', {
      totalProdutos: produtos.length,
      produtoBaseNorm,
      tipoNorm
    });
    
    // Busca EXATA primeiro (threshold máximo)
    const produtosExatos = produtos.filter(p => {
      const nomeBaseNorm = normalizarNome(p.nome_base || p.produto || '');
      const similarity = calcularSimilaridade(nomeBaseNorm, produtoBaseNorm);
      
      // ⚠️ VALIDAÇÃO SEMÂNTICA ANTES DE ACEITAR
      const validacao = testarValidacaoSemantica(produtoBase, p.nome_base || p.produto || '');
      
      logAssociation('COMPARACAO_EXATA', {
        produtoTeste: p.nome_base || p.produto,
        produtoBase,
        similarity,
        validacao,
        aceito: similarity > 0.95 && !validacao.blacklisted && validacao.semanticallySimilar
      });
      
      // Aceitar apenas se passou em TODAS as validações
      return similarity > 0.95 && !validacao.blacklisted && validacao.semanticallySimilar;
    });
    
    let produtosBase = produtosExatos;
    
    // Se não encontrou matches exatos, buscar similares (threshold alto + validação)
    if (produtosBase.length === 0) {
      console.log(`⚠️ [Refinamento] Nenhum match exato validado, buscando similares...`);
      
      produtosBase = produtos.filter(p => {
        const nomeBaseNorm = normalizarNome(p.nome_base || p.produto || '');
        const similarity = calcularSimilaridade(nomeBaseNorm, produtoBaseNorm);
        
        // ⚠️ VALIDAÇÃO SEMÂNTICA OBRIGATÓRIA
        const validacao = testarValidacaoSemantica(produtoBase, p.nome_base || p.produto || '');
        
        logAssociation('COMPARACAO_SIMILAR', {
          produtoTeste: p.nome_base || p.produto,
          produtoBase,
          similarity,
          validacao,
          aceito: similarity > 0.85 && !validacao.blacklisted && validacao.semanticallySimilar
        });
        
        // Aceitar apenas se passou em TODAS as validações
        return similarity > 0.85 && !validacao.blacklisted && validacao.semanticallySimilar;
      });
    }
    
    if (produtosBase.length === 0) {
      logAssociation('NENHUM_PRODUTO_ENCONTRADO', { produtoBase, tipoIdentificado });
      console.log(`❌ [Refinamento] Nenhum produto encontrado para "${produtoBase}"`);
      return null;
    }
    
    logAssociation('PRODUTOS_CANDIDATOS', {
      total: produtosBase.length,
      produtos: produtosBase.map(p => ({ id: p.id, nome: p.nome_base || p.produto }))
    });
    
    console.log(`📋 [Refinamento] ${produtosBase.length} produtos candidatos encontrados`);
    
    // Busca variação específica com validação semântica RIGOROSA
    let melhorMatch: { produto: ProdutoBanco; score: number } | null = null;
    
    for (const produto of produtosBase) {
      if (!produto.nome_variacao) continue;
      
      const variacaoNorm = normalizarNome(produto.nome_variacao);
      const similarity = calcularSimilaridade(variacaoNorm, tipoNorm);
      
      // ⚠️ VALIDAÇÃO SEMÂNTICA PARA VARIAÇÕES
      const validacaoVariacao = testarValidacaoSemantica(tipoIdentificado, produto.nome_variacao);
      
      logAssociation('TESTE_VARIACAO', {
        produtoBase: produto.nome_base || produto.produto,
        variacao: produto.nome_variacao,
        tipoIdentificado,
        similarity,
        validacao: validacaoVariacao
      });
      
      // Aplicar validação semântica rigorosa
      if (validacaoVariacao.blacklisted || !validacaoVariacao.semanticallySimilar) {
        logAssociation('VARIACAO_REJEITADA_SEMANTICA', {
          variacao: produto.nome_variacao,
          tipoIdentificado,
          motivo: validacaoVariacao.blacklisted ? 'blacklisted' : 'categoria_incompativel',
          categoriaVariacao: validacaoVariacao.categoria1,
          categoriaTipo: validacaoVariacao.categoria2
        });
        continue; // Pular esta variação
      }
      
      // Apenas aceitar scores muito altos (0.9+) para variações
      if (similarity > Math.max(melhorMatch?.score || 0, 0.9)) {
        melhorMatch = { produto, score: similarity };
        
        logAssociation('NOVA_MELHOR_VARIACAO', {
          produto: produto.nome_base || produto.produto,
          variacao: produto.nome_variacao,
          score: similarity,
          validacaoSemantica: validacaoVariacao
        });
      }
    }
    
    // Retorna melhor match somente se score for MUITO ALTO
    if (melhorMatch && melhorMatch.score > 0.9) { // Aumentado de 0.7 para 0.9
      logAssociation('VARIACAO_ACEITA', {
        produtoOriginal: produtoBase,
        tipoOriginal: tipoIdentificado,
        produtoFinal: melhorMatch.produto.nome_base || melhorMatch.produto.produto,
        tipoFinal: melhorMatch.produto.nome_variacao,
        score: melhorMatch.score,
        fonte: 'variacao_especifica'
      });
      
      console.log(`✅ [Refinamento] Variação aceita: "${melhorMatch.produto.nome_variacao}" (${(melhorMatch.score * 100).toFixed(1)}%)`);
      return {
        produtoId: melhorMatch.produto.id,
        produto: melhorMatch.produto.nome_base || melhorMatch.produto.produto || produtoBase,
        tipo: melhorMatch.produto.nome_variacao || tipoIdentificado,
        confianca: melhorMatch.score,
        fonte: melhorMatch.score > 0.95 ? 'exato' : 'similar'
      };
    }
    
    // Fallback final - produto base SOMENTE se score for suficiente
    const produtoBasePrincipal = produtosBase[0];
    const scoreBase = calcularSimilaridade(
      normalizarNome(produtoBasePrincipal.nome_base || produtoBasePrincipal.produto || ''),
      produtoBaseNorm
    );
    
    // THRESHOLD ALTO para produto base também
    if (scoreBase > 0.85) { // Apenas aceitar se realmente similar
      logAssociation('PRODUTO_BASE_ACEITO', {
        produtoOriginal: produtoBase,
        tipoOriginal: tipoIdentificado,
        produtoFinal: produtoBasePrincipal.nome_base || produtoBasePrincipal.produto,
        scoreBase,
        fonte: 'produto_base'
      });
      
      console.log(`🔄 [Refinamento] Produto base aceito: "${produtoBasePrincipal.nome_base || produtoBasePrincipal.produto}" (${(scoreBase * 100).toFixed(1)}%)`);
      
      return {
        produtoId: produtoBasePrincipal.id,
        produto: produtoBasePrincipal.nome_base || produtoBasePrincipal.produto || produtoBase,
        tipo: tipoIdentificado,
        confianca: scoreBase,
        fonte: 'base'
      };
    } else {
      // REJEITAR se score não for suficiente
      logAssociation('PRODUTO_REJEITADO', {
        produtoOriginal: produtoBase,
        tipoOriginal: tipoIdentificado,
        produtoTeste: produtoBasePrincipal.nome_base || produtoBasePrincipal.produto,
        scoreBase,
        motivo: 'score_insuficiente'
      });
      
      console.log(`❌ [Refinamento] Produto rejeitado por score baixo: "${produtoBasePrincipal.nome_base || produtoBasePrincipal.produto}" (${(scoreBase * 100).toFixed(1)}%)`);
      return null;
    }
    
  } catch (error) {
    logAssociation('ERRO_REFINAMENTO', {
      produtoBase,
      tipoIdentificado,
      erro: error instanceof Error ? error.message : String(error)
    });
    console.error('❌ [Refinement] Erro no refinamento:', error);
    return null;
  }
};

// Limpa cache quando necessário
export const limparCacheRefinamento = (): void => {
  produtosBancoCache = null;
  console.log('🧹 [Refinamento] Cache de refinamento limpo');
};