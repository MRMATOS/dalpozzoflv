import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { 
  buscarProdutoPai, 
  buscarVariacao, 
  isGenericType, 
  logProductMapping,
  clearProductCache 
} from '@/utils/productExtraction/productUtils';
import { intelligentProductSearch, contextualSearch } from '@/utils/productExtraction/advancedSearch';

// ⚠️ ROLLBACK CONTROLADO - FASE 1
// Sistema de similaridade inteligente e busca avançada temporariamente limitados
const ADVANCED_SEARCH_ENABLED = false;
const INTELLIGENT_SEARCH_ENABLED = false;
const DEBUG_EXTRACTION = true;

interface MapeamentoProduto {
  alias: string;
  aliasNormalizado: string;
  produto: string;
  tipo: string;
}

// Função para normalizar texto removendo acentos e caracteres especiais
const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais (exceto espaços)
    .replace(/\s+/g, ' ') // Múltiplos espaços -> um espaço
    .trim();
};

// Cache otimizado para o dicionário com TTL
let dicionarioOtimizado: MapeamentoProduto[] | null = null;
let dicionarioLoadTime: number = 0;
const DICIONARIO_CACHE_TTL = 60 * 60 * 1000; // 1 hora
const extractionCache = new Map<string, ProdutoExtraido[]>();
const EXTRACTION_CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// Função que cria e armazena em cache uma versão otimizada do dicionário
const getDicionarioOtimizado = (): MapeamentoProduto[] => {
  const now = Date.now();
  
  // Cache ainda válido
  if (dicionarioOtimizado && (now - dicionarioLoadTime) < DICIONARIO_CACHE_TTL) {
    return dicionarioOtimizado;
  }

  const listaMapeamentos: MapeamentoProduto[] = [];

  for (const [nomeProduto, tipos] of Object.entries(dicionarioProdutos)) {
    for (const [nomeTipo, aliases] of Object.entries(tipos)) {
      for (const alias of aliases) {
        const aliasNormalizado = normalizarTexto(alias);
        listaMapeamentos.push({
          alias: alias.toLowerCase(),
          aliasNormalizado,
          produto: nomeProduto,
          tipo: nomeTipo,
        });
      }
    }
  }

  // Ordena por comprimento do alias normalizado, do maior para o menor.
  // Isso garante que "tomate longa vida" seja encontrado antes de "tomate".
  listaMapeamentos.sort((a, b) => b.aliasNormalizado.length - a.aliasNormalizado.length);
  
  dicionarioOtimizado = listaMapeamentos;
  dicionarioLoadTime = now;
  console.log(`Dicionário otimizado carregado: ${listaMapeamentos.length} entradas`);
  return dicionarioOtimizado;
};

// Função auxiliar para extrair descrição original limpa (sem preço)
const extrairDescricaoOriginal = (linhaOriginal: string): string => {
  // Remove preços da linha
  const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
  let descricao = linhaOriginal.replace(regexPreco, '').trim();
  
  // Remove caracteres de separação comuns
  descricao = descricao.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();
  descricao = descricao.replace(/\s+/g, ' ');
  
  return descricao;
};

// Função aprimorada para buscar produto pai ou variação específica no banco
const buscarProdutoOuVariacao = async (nomeProduto: string, nomeVariacao: string): Promise<{
  produto: any;
  ehProdutoPai: boolean;
} | null> => {
  try {
    // Log detalhado do processo de busca
    logProductMapping('INICIO_BUSCA_PRODUTO_VARIACAO', {
      nomeProduto,
      nomeVariacao,
      tipoGenerico: isGenericType(nomeVariacao || ''),
      timestamp: new Date().toISOString()
    });

    // Primeiro, tentar buscar variação específica SE não for genérico
    if (nomeVariacao && !isGenericType(nomeVariacao)) {
      logProductMapping('TENTANDO_BUSCAR_VARIACAO_ESPECIFICA', {
        nomeProduto,
        nomeVariacao,
        motivo: 'tipo_nao_generico'
      });
      
      const variacao = await buscarVariacao(nomeProduto, nomeVariacao);
      if (variacao) {
        logProductMapping('VARIACAO_ENCONTRADA_BANCO', {
          nomeProduto,
          nomeVariacao,
          produtoId: variacao.id,
          nomeVariacaoBanco: variacao.nome_variacao,
          nomeProdutoBanco: variacao.produto, // Agora já vem com nome completo "Produto Pai + Variação"
          produtoCompleto: variacao.produto, // Redundante mas garante que nunca seja null
          origem: 'banco_variacao_especifica',
          success: true
        });
        return { produto: variacao, ehProdutoPai: false };
      } else {
        logProductMapping('VARIACAO_NAO_ENCONTRADA_BANCO', {
          nomeProduto,
          nomeVariacao,
          motivo: 'nao_existe_ou_nao_combina',
          proximoPasso: 'buscar_produto_pai'
        });
      }
    } else {
      logProductMapping('PULANDO_BUSCA_VARIACAO', {
        nomeProduto,
        nomeVariacao,
        motivo: isGenericType(nomeVariacao || '') ? 'tipo_generico' : 'nome_variacao_vazio'
      });
    }

    // Se não encontrou variação específica OU é tipo genérico, buscar produto pai
    logProductMapping('TENTANDO_BUSCAR_PRODUTO_PAI', {
      nomeProduto,
      nomeVariacao,
      motivo: isGenericType(nomeVariacao || '') ? 'tipo_generico' : 'variacao_nao_encontrada'
    });
    
    const produtoPai = await buscarProdutoPai(nomeProduto);
    if (produtoPai) {
      // Garantir que produto pai sempre tenha nome válido
      const nomeCompleto = produtoPai.produto || produtoPai.nome_base || 'Produto sem nome';
      const produtoPaiCompleto = {
        ...produtoPai,
        produto: nomeCompleto
      };
      
      logProductMapping('PRODUTO_PAI_ENCONTRADO_BANCO', {
        nomeProduto,
        nomeVariacao,
        produtoId: produtoPai.id,
        nomeProdutoBanco: nomeCompleto,
        origem: 'banco_produto_pai',
        motivo: isGenericType(nomeVariacao || '') ? 'tipo_generico' : 'variacao_nao_encontrada',
        success: true
      });
      return { produto: produtoPaiCompleto, ehProdutoPai: true };
    }

    // Nenhum resultado encontrado
    logProductMapping('NENHUM_PRODUTO_ENCONTRADO_BANCO', {
      nomeProduto,
      nomeVariacao,
      origem: 'banco_sem_resultado',
      tentativas: ['variacao_especifica', 'produto_pai'],
      success: false
    });
    return null;
    
  } catch (error) {
    console.error('Erro ao buscar produto no banco:', error);
    logProductMapping('ERRO_BUSCA_BANCO', {
      nomeProduto,
      nomeVariacao,
      erro: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
};

// Nova função assíncrona que integra automaticamente com banco de dados
export const extrairProdutosComIntegracao = async (mensagem: string, nomeFornecedor: string): Promise<ProdutoExtraido[]> => {
  if (!mensagem?.trim()) {
    console.warn('Mensagem vazia ou inválida');
    return [];
  }

  // Cache key baseado na mensagem e fornecedor
  const cacheKey = `${nomeFornecedor}:${mensagem.substring(0, 100)}`;
  
  const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
  const produtosMap = new Map<string, ProdutoExtraido>();
  const dicionario = getDicionarioOtimizado();

  // Log inicial da extração
  logProductMapping('inicio_extracao_integrada', {
    fornecedor: nomeFornecedor,
    totalLinhas: linhas.length,
    timestamp: new Date().toISOString()
  });

  // Primeira passada: extrair produtos usando dicionário
  const produtosSemBanco: ProdutoExtraido[] = [];
  
  linhas.forEach(linha => {
    const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
    const precos = linha.match(regexPreco);
    
    if (!precos) return;
    
    const linhaNormalizada = normalizarTexto(linha);
    let produtoEncontrado: { produto: string; tipo: string; alias: string; } | null = null;

    // 1. Busca contextual (CONTROLADA)
    if (ADVANCED_SEARCH_ENABLED) {
      const contextualResult = contextualSearch(linha);
      if (contextualResult.produto && contextualResult.tipo) {
        produtoEncontrado = {
          produto: contextualResult.produto,
          tipo: contextualResult.tipo,
          alias: linha
        };
        
        if (DEBUG_EXTRACTION) {
          console.log(`🔍 [DEBUG-EXTRACT] Contextual encontrado: ${contextualResult.produto} - ${contextualResult.tipo}`);
        }
      }
    }
    
    // 2. Busca EXATA no dicionário (método tradicional e confiável)
    if (!produtoEncontrado) {
      for (const mapeamento of dicionario) {
        if (linhaNormalizada.includes(mapeamento.aliasNormalizado)) {
          produtoEncontrado = {
            produto: mapeamento.produto,
            tipo: mapeamento.tipo,
            alias: mapeamento.alias,
          };
          
          if (DEBUG_EXTRACTION) {
            console.log(`🔍 [DEBUG-EXTRACT] Dicionário encontrado: ${mapeamento.produto} - ${mapeamento.tipo} via alias "${mapeamento.alias}"`);
          }
          
          // Para matches muito específicos, parar busca
          if (mapeamento.aliasNormalizado.length > linhaNormalizada.length * 0.6) {
            break;
          }
        }
      }
    }
    
    // 3. Busca inteligente (DESABILITADA temporariamente)
    if (!produtoEncontrado && INTELLIGENT_SEARCH_ENABLED) {
      const intelligentResult = intelligentProductSearch(linha, dicionarioProdutos);
      if (intelligentResult && intelligentResult.confidence >= 85) { // Threshold mais alto
        produtoEncontrado = {
          produto: intelligentResult.produto,
          tipo: intelligentResult.tipo,
          alias: intelligentResult.original
        };
        
        if (DEBUG_EXTRACTION) {
          console.log(`🔍 [DEBUG-EXTRACT] Inteligente encontrado: ${intelligentResult.produto} - ${intelligentResult.tipo} (conf: ${intelligentResult.confidence}%)`);
        }
      }
    }

    if (produtoEncontrado) {
      const preco = precos && precos.length > 0 ? precos[precos.length - 1].replace(',', '.') : null;
      
      let infoAdicional = linha;
      if (precos) {
        precos.forEach(p => {
          infoAdicional = infoAdicional.replace(p, '');
        });
      }

      const indexAlias = infoAdicional.toLowerCase().indexOf(produtoEncontrado.alias);
      if (indexAlias !== -1) {
        const antesAlias = infoAdicional.substring(0, indexAlias).trim();
        const depoisAlias = infoAdicional.substring(indexAlias + produtoEncontrado.alias.length).trim();
        infoAdicional = (antesAlias + ' ' + depoisAlias).trim();
      }

      infoAdicional = infoAdicional.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();

      let tipoFinal = produtoEncontrado.tipo;
      if (infoAdicional && infoAdicional.length > 1) {
        tipoFinal += (produtoEncontrado.tipo === 'padrão' ? '' : ' ') + infoAdicional;
      }

      const nomeProdutoLowerCase = produtoEncontrado.produto.toLowerCase();
      const tipoFinalLowerCase = tipoFinal.toLowerCase();
      if (tipoFinalLowerCase.includes(nomeProdutoLowerCase)) {
        tipoFinal = tipoFinal.replace(new RegExp(produtoEncontrado.produto, 'gi'), '').trim();
        tipoFinal = tipoFinal.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
        if (!tipoFinal || tipoFinal.length === 0) {
          tipoFinal = ''; // Não adicionar "padrão" - associar ao produto pai
        }
      }

      const chaveItem = `${produtoEncontrado.produto}_${tipoFinal}`;
      const itemExistente = produtosSemBanco.find(p => `${p.produto}_${p.tipo || ''}` === chaveItem);

      const deveSubstituir = !itemExistente || 
                            (preco !== null && (itemExistente.preco === null || itemExistente.preco === 0));

      if (deveSubstituir) {
        if (itemExistente) {
          const index = produtosSemBanco.indexOf(itemExistente);
          produtosSemBanco.splice(index, 1);
        }

        produtosSemBanco.push({
          produto: produtoEncontrado.produto.charAt(0).toUpperCase() + produtoEncontrado.produto.slice(1),
          tipo: (isGenericType(tipoFinal) || !tipoFinal) ? '' : tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
          preco: preco ? parseFloat(preco) : null,
          fornecedor: nomeFornecedor,
          linhaOriginal: linha,
          aliasUsado: produtoEncontrado.alias,
          origem: 'dicionario',
          confianca: 0.8
        });
      }
    }
  });

  // Segunda passada: resolver IDs no banco de dados para cada produto
  const produtosComBanco: ProdutoExtraido[] = [];
  
  for (const produto of produtosSemBanco) {
    try {
      const resultadoBanco = await buscarProdutoOuVariacao(produto.produto, produto.tipo || '');
      
      if (resultadoBanco) {
        // Usar dados corretos do banco, especialmente para variações
        const produtoFinal = {
          ...produto,
          produtoId: resultadoBanco.produto.id,
          variacaoId: resultadoBanco.ehProdutoPai ? undefined : resultadoBanco.produto.id,
          confianca: 0.95, // Alta confiança quando encontra no banco
          origem: 'banco' as const
        };
        
        // Se é uma variação, usar o nome completo e dados corretos
        if (!resultadoBanco.ehProdutoPai) {
          // Para variações, usar nome completo construído ou do banco
          const nomeCompleto = resultadoBanco.produto.produto || 
                              `${resultadoBanco.produto.nome_base || 'Produto'} ${resultadoBanco.produto.nome_variacao || ''}`.trim();
          
          produtoFinal.produto = nomeCompleto; // Nome completo: "Pimentão Amarelo"
          produtoFinal.tipo = resultadoBanco.produto.nome_variacao || ''; // "Amarelo" ou vazio para produto pai
          
          logProductMapping('VARIACAO_BANCO_ENCONTRADA', {
            produtoOriginal: produto.produto,
            tipoOriginal: produto.tipo,
            produtoFinal: produtoFinal.produto,
            tipoFinal: produtoFinal.tipo,
            produtoId: resultadoBanco.produto.id
          });
        }
        
        produtosComBanco.push(produtoFinal);
        
        logProductMapping('produto_integrado_sucesso', {
          produto: produto.produto,
          tipo: produto.tipo,
          produtoId: resultadoBanco.produto.id,
          ehProdutoPai: resultadoBanco.ehProdutoPai,
          fornecedor: nomeFornecedor
        });
      } else {
        // Não encontrou no banco, manter como estava
        produtosComBanco.push({
          ...produto,
          confianca: 0.6 // Baixa confiança quando não encontra no banco
        });
        
        logProductMapping('produto_nao_integrado', {
          produto: produto.produto,
          tipo: produto.tipo,
          fornecedor: nomeFornecedor,
          motivo: 'nao_encontrado_banco'
        });
      }
    } catch (error) {
      console.error(`Erro ao buscar produto ${produto.produto} no banco:`, error);
      
      // Erro na busca, manter como estava
      produtosComBanco.push({
        ...produto,
        confianca: 0.5 // Muito baixa confiança em caso de erro
      });
      
      logProductMapping('erro_integracao', {
        produto: produto.produto,
        tipo: produto.tipo,
        fornecedor: nomeFornecedor,
        erro: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Cache do resultado
  extractionCache.set(cacheKey, produtosComBanco);
  setTimeout(() => extractionCache.delete(cacheKey), EXTRACTION_CACHE_TTL);

  // Log final da extração
  logProductMapping('fim_extracao_integrada', {
    fornecedor: nomeFornecedor,
    totalProdutosExtraidos: produtosComBanco.length,
    produtosComId: produtosComBanco.filter(p => p.produtoId).length,
    produtosSemId: produtosComBanco.filter(p => !p.produtoId).length,
    confiancaMedia: produtosComBanco.reduce((acc, p) => acc + (p.confianca || 0), 0) / produtosComBanco.length
  });

  return produtosComBanco;
};

// Função síncrona mantida para compatibilidade
export const extrairProdutos = (mensagem: string, nomeFornecedor: string): ProdutoExtraido[] => {
  if (!mensagem?.trim()) {
    console.warn('Mensagem vazia ou inválida');
    return [];
  }

  // Cache key baseado na mensagem e fornecedor
  const cacheKey = `${nomeFornecedor}:${mensagem.substring(0, 100)}`;
  const cached = extractionCache.get(cacheKey);
  if (cached) {
    console.info('Usando resultado cacheado da extração');
    return cached;
  }

  const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
  const produtosMap = new Map<string, ProdutoExtraido>();
  const dicionario = getDicionarioOtimizado();

  // Log inicial da extração
  logProductMapping('inicio_extracao', {
    fornecedor: nomeFornecedor,
    totalLinhas: linhas.length,
    timestamp: new Date().toISOString()
  });

  linhas.forEach(linha => {
    // Regex para encontrar preços nos formatos: xx.xx, x.xx, xx,xx, x,xx, x,x, x.x
    const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
    const precos = linha.match(regexPreco);
    
    // Early exit se não há preço - otimização
    if (!precos) return;
    
    const linhaNormalizada = normalizarTexto(linha);
    let produtoEncontrado: { produto: string; tipo: string; alias: string; } | null = null;

    // Loop otimizado no dicionário - buscar por alias normalizado
    for (const mapeamento of dicionario) {
      if (linhaNormalizada.includes(mapeamento.aliasNormalizado)) {
        produtoEncontrado = {
          produto: mapeamento.produto,
          tipo: mapeamento.tipo,
          alias: mapeamento.alias,
        };
        
        // Se encontramos um match muito específico, parar busca
        if (mapeamento.aliasNormalizado.length > linhaNormalizada.length * 0.6) {
          break;
        }
      }
    }

    if (produtoEncontrado) {
      const preco = precos && precos.length > 0 ? precos[precos.length - 1].replace(',', '.') : null;
      
      let infoAdicional = linha;

      if (precos) {
        precos.forEach(p => {
          infoAdicional = infoAdicional.replace(p, '');
        });
      }

      const indexAlias = infoAdicional.toLowerCase().indexOf(produtoEncontrado.alias);
      if (indexAlias !== -1) {
        const antesAlias = infoAdicional.substring(0, indexAlias).trim();
        const depoisAlias = infoAdicional.substring(indexAlias + produtoEncontrado.alias.length).trim();
        infoAdicional = (antesAlias + ' ' + depoisAlias).trim();
      }

      infoAdicional = infoAdicional.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();

      let tipoFinal = produtoEncontrado.tipo;
      if (infoAdicional && infoAdicional.length > 1) {
        tipoFinal += (produtoEncontrado.tipo === 'padrão' ? '' : ' ') + infoAdicional;
      }

      const nomeProdutoLowerCase = produtoEncontrado.produto.toLowerCase();
      const tipoFinalLowerCase = tipoFinal.toLowerCase();
      if (tipoFinalLowerCase.includes(nomeProdutoLowerCase)) {
        tipoFinal = tipoFinal.replace(new RegExp(produtoEncontrado.produto, 'gi'), '').trim();
        tipoFinal = tipoFinal.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
        if (!tipoFinal || tipoFinal.length === 0) {
          tipoFinal = ''; // Não adicionar "padrão" - associar ao produto pai
        }
      }

      const chaveItem = `${produtoEncontrado.produto}_${tipoFinal}`;
      const itemExistente = produtosMap.get(chaveItem);

      // REGRA DE PRIORIZAÇÃO: Produto com preço sempre prevalece sobre produto sem preço
      const deveSubstituir = !itemExistente || 
                            (preco !== null && (itemExistente.preco === null || itemExistente.preco === 0));

      if (deveSubstituir) {
        // Lógica original simplificada para função síncrona
        let tipoFinalProcessado = tipoFinal;
        
        // Para tipos genéricos ou vazios, não adicionar "Padrão"
        if (isGenericType(tipoFinal) || tipoFinal.toLowerCase() === 'padrão') {
          tipoFinalProcessado = '';
        }

        produtosMap.set(chaveItem, {
          produto: produtoEncontrado.produto.charAt(0).toUpperCase() + produtoEncontrado.produto.slice(1),
          tipo: tipoFinalProcessado ? tipoFinalProcessado.charAt(0).toUpperCase() + tipoFinalProcessado.slice(1) : '',
          preco: preco ? parseFloat(preco) : null,
          fornecedor: nomeFornecedor,
          linhaOriginal: linha,
          aliasUsado: produtoEncontrado.alias,
          confianca: 0.8,
          origem: 'dicionario'
        });
      }
    }
  });

  const resultado = Array.from(produtosMap.values());
  
  // Cache do resultado
  extractionCache.set(cacheKey, resultado);
  setTimeout(() => extractionCache.delete(cacheKey), EXTRACTION_CACHE_TTL);

  // Log final da extração
  logProductMapping('fim_extracao', {
    fornecedor: nomeFornecedor,
    totalProdutosExtraidos: produtosMap.size,
    produtosComId: resultado.filter(p => p.produtoId).length,
    produtosSemId: resultado.filter(p => !p.produtoId).length
  });

  return resultado;
};

// Versão síncrona para compatibilidade (fallback)
export const extrairProdutosSincrono = (mensagem: string, nomeFornecedor: string): ProdutoExtraido[] => {
  const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
  const produtosMap = new Map<string, ProdutoExtraido>();
  const dicionario = getDicionarioOtimizado();

  linhas.forEach(linha => {
    const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
    const precos = linha.match(regexPreco);
    const linhaNormalizada = normalizarTexto(linha);
    let produtoEncontrado: { produto: string; tipo: string; alias: string; } | null = null;

    for (const mapeamento of dicionario) {
      if (linhaNormalizada.includes(mapeamento.aliasNormalizado)) {
        produtoEncontrado = {
          produto: mapeamento.produto,
          tipo: mapeamento.tipo,
          alias: mapeamento.alias,
        };
        break; 
      }
    }

    if (produtoEncontrado) {
      const preco = precos && precos.length > 0 ? precos[precos.length - 1].replace(',', '.') : null;
      let infoAdicional = linha;

      if (precos) {
        precos.forEach(p => {
          infoAdicional = infoAdicional.replace(p, '');
        });
      }

      const indexAlias = infoAdicional.toLowerCase().indexOf(produtoEncontrado.alias);
      if (indexAlias !== -1) {
        const antesAlias = infoAdicional.substring(0, indexAlias).trim();
        const depoisAlias = infoAdicional.substring(indexAlias + produtoEncontrado.alias.length).trim();
        infoAdicional = (antesAlias + ' ' + depoisAlias).trim();
      }

      infoAdicional = infoAdicional.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();

      let tipoFinal = produtoEncontrado.tipo;
      if (infoAdicional && infoAdicional.length > 1) {
        tipoFinal += (produtoEncontrado.tipo === 'padrão' ? '' : ' ') + infoAdicional;
      }

      const nomeProdutoLowerCase = produtoEncontrado.produto.toLowerCase();
      const tipoFinalLowerCase = tipoFinal.toLowerCase();
      if (tipoFinalLowerCase.includes(nomeProdutoLowerCase)) {
        tipoFinal = tipoFinal.replace(new RegExp(produtoEncontrado.produto, 'gi'), '').trim();
        tipoFinal = tipoFinal.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
        if (!tipoFinal || tipoFinal.length === 0) {
          tipoFinal = ''; // Não adicionar "padrão" - associar ao produto pai
        }
      }

      const chaveItem = `${produtoEncontrado.produto}_${tipoFinal}`;
      const itemExistente = produtosMap.get(chaveItem);

      const deveSubstituir = !itemExistente || 
                            (preco !== null && (itemExistente.preco === null || itemExistente.preco === 0));

      if (deveSubstituir) {
        produtosMap.set(chaveItem, {
          produto: produtoEncontrado.produto.charAt(0).toUpperCase() + produtoEncontrado.produto.slice(1),
          tipo: (isGenericType(tipoFinal) || !tipoFinal) ? '' : tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
          preco: preco ? parseFloat(preco) : null,
          fornecedor: nomeFornecedor,
          linhaOriginal: linha,
          aliasUsado: produtoEncontrado.alias,
          origem: 'dicionario' as const,
          confianca: 0.8
        });
      }
    }
  });

  return Array.from(produtosMap.values());
};

// Função de teste para verificar funcionamento
export const testarMapeamentoProdutoPai = async (nomeProduto: string, nomeVariacao: string): Promise<any> => {
  try {
    const resultado = await buscarProdutoOuVariacao(nomeProduto, nomeVariacao);
    return {
      sucesso: true,
      resultado,
      isGeneric: isGenericType(nomeVariacao)
    };
  } catch (error) {
    return {
      sucesso: false,
      erro: error instanceof Error ? error.message : String(error)
    };
  }
};
