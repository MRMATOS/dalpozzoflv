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
import { enriquecerProdutosExtraidos, recuperarAprendizados } from './databaseIntegration';

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

// Nova função para buscar produto pai ou variação específica no banco
const buscarProdutoOuVariacao = async (nomeProduto: string, nomeVariacao: string): Promise<{
  produto: any;
  ehProdutoPai: boolean;
} | null> => {
  try {
    // Primeiro, tentar buscar variação específica
    if (nomeVariacao && !isGenericType(nomeVariacao)) {
      const variacao = await buscarVariacao(nomeProduto, nomeVariacao);
      if (variacao) {
        logProductMapping('produto_variacao_encontrada', {
          nomeProduto,
          nomeVariacao,
          produtoId: variacao.id,
          origem: 'banco_variacao'
        });
        return { produto: variacao, ehProdutoPai: false };
      }
    }

    // Se não encontrou variação ou é tipo genérico, buscar produto pai
    const produtoPai = await buscarProdutoPai(nomeProduto);
    if (produtoPai) {
      logProductMapping('produto_pai_usado', {
        nomeProduto,
        nomeVariacao,
        produtoId: produtoPai.id,
        origem: 'banco_produto_pai',
        motivo: isGenericType(nomeVariacao) ? 'tipo_generico' : 'variacao_nao_encontrada'
      });
      return { produto: produtoPai, ehProdutoPai: true };
    }

    logProductMapping('produto_nao_encontrado', {
      nomeProduto,
      nomeVariacao,
      origem: 'banco_sem_resultado'
    });
    return null;
  } catch (error) {
    console.error('Erro ao buscar produto no banco:', error);
    logProductMapping('erro_busca_banco', {
      nomeProduto,
      nomeVariacao,
      erro: error instanceof Error ? error.message : String(error)
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

    // 1. Busca contextual primeiro (mais rápida e precisa)
    const contextualResult = contextualSearch(linha);
    if (contextualResult.produto && contextualResult.tipo) {
      produtoEncontrado = {
        produto: contextualResult.produto,
        tipo: contextualResult.tipo,
        alias: linha
      };
    }
    
    // 2. Busca exata no dicionário (método atual)
    if (!produtoEncontrado) {
      for (const mapeamento of dicionario) {
        if (linhaNormalizada.includes(mapeamento.aliasNormalizado)) {
          produtoEncontrado = {
            produto: mapeamento.produto,
            tipo: mapeamento.tipo,
            alias: mapeamento.alias,
          };
          
          if (mapeamento.aliasNormalizado.length > linhaNormalizada.length * 0.6) {
            break;
          }
        }
      }
    }
    
    // 3. Busca inteligente com tolerância a erros (fallback)
    if (!produtoEncontrado) {
      const intelligentResult = intelligentProductSearch(linha, dicionarioProdutos);
      if (intelligentResult && intelligentResult.confidence >= 75) {
        produtoEncontrado = {
          produto: intelligentResult.produto,
          tipo: intelligentResult.tipo,
          alias: intelligentResult.original
        };
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
          tipoFinal = 'padrão';
        }
      }

      const chaveItem = `${produtoEncontrado.produto}_${tipoFinal}`;
      const itemExistente = produtosSemBanco.find(p => `${p.produto}_${p.tipo || 'padrão'}` === chaveItem);

      const deveSubstituir = !itemExistente || 
                            (preco !== null && (itemExistente.preco === null || itemExistente.preco === 0));

      if (deveSubstituir) {
        if (itemExistente) {
          const index = produtosSemBanco.indexOf(itemExistente);
          produtosSemBanco.splice(index, 1);
        }

        produtosSemBanco.push({
          produto: produtoEncontrado.produto.charAt(0).toUpperCase() + produtoEncontrado.produto.slice(1),
          tipo: isGenericType(tipoFinal) ? 'padrão' : tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
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
      const resultadoBanco = await buscarProdutoOuVariacao(produto.produto, produto.tipo || 'padrão');
      
      if (resultadoBanco) {
        produtosComBanco.push({
          ...produto,
          produtoId: resultadoBanco.produto.id,
          variacaoId: resultadoBanco.ehProdutoPai ? undefined : resultadoBanco.produto.id,
          confianca: 0.95, // Alta confiança quando encontra no banco
          origem: 'banco'
        });
        
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
          tipoFinal = 'padrão';
        }
      }

      const chaveItem = `${produtoEncontrado.produto}_${tipoFinal}`;
      const itemExistente = produtosMap.get(chaveItem);

      // REGRA DE PRIORIZAÇÃO: Produto com preço sempre prevalece sobre produto sem preço
      const deveSubstituir = !itemExistente || 
                            (preco !== null && (itemExistente.preco === null || itemExistente.preco === 0));

      if (deveSubstituir) {
        // NOVA LÓGICA FASE 3: Determinar se deve usar produto pai ou variação
        let produtoFinalNome = produtoEncontrado.produto;
        let tipoFinalProcessado = tipoFinal;
        let produtoId: string | undefined;
        let variacaoId: string | undefined;
        let confianca = 0.8; // Confiança alta para dicionário
        let origem: 'dicionario' | 'sinonimo' | 'banco' | 'manual' = 'dicionario';

        // Se o tipo é genérico ou "padrão", usar produto pai
        if (isGenericType(tipoFinal) || tipoFinal.toLowerCase() === 'padrão') {
          logProductMapping('tipo_generico_detectado', {
            produto: produtoEncontrado.produto,
            tipo: tipoFinal,
            alias: produtoEncontrado.alias
          });
          
          // Para tipos genéricos, não precisamos buscar no banco agora - será feito sob demanda
          tipoFinalProcessado = null; // Sem variação, é o produto pai
          variacaoId = undefined;
          confianca = 0.85; // Confiança boa para dicionário + regra de negócio
        } else {
          // Tipo específico - manter como está, busca no banco será sob demanda
          confianca = 0.8;
        }

        produtosMap.set(chaveItem, {
          produto: produtoFinalNome.charAt(0).toUpperCase() + produtoFinalNome.slice(1),
          tipo: tipoFinalProcessado ? tipoFinalProcessado.charAt(0).toUpperCase() + tipoFinalProcessado.slice(1) : null,
          preco: preco ? parseFloat(preco) : null,
          fornecedor: nomeFornecedor,
          linhaOriginal: linha,
          aliasUsado: produtoEncontrado.alias,
          produtoId,
          variacaoId,
          confianca,
          origem
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
          tipoFinal = 'padrão';
        }
      }

      const chaveItem = `${produtoEncontrado.produto}_${tipoFinal}`;
      const itemExistente = produtosMap.get(chaveItem);

      const deveSubstituir = !itemExistente || 
                            (preco !== null && (itemExistente.preco === null || itemExistente.preco === 0));

      if (deveSubstituir) {
        produtosMap.set(chaveItem, {
          produto: produtoEncontrado.produto.charAt(0).toUpperCase() + produtoEncontrado.produto.slice(1),
          tipo: isGenericType(tipoFinal) ? 'padrão' : tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
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
