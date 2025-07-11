import { supabase } from '@/integrations/supabase/client';
import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { refinarIdentificacaoProduto } from './refinementService';
import { aplicarFallback, fallbackSystem } from './fallbackSystem';
import { migrarDicionarioParaSinonimos } from './migrationService';

interface MapeamentoProduto {
  alias: string;
  produto: string;
  tipo: string;
}

interface SinonimoBanco {
  id: string;
  sinonimo: string;
  produto_id: string;
}

interface ProdutoBanco {
  id: string;
  produto: string;
  nome_variacao: string | null;
  nome_base: string | null;
}

// Cache para dados
let dicionarioOtimizado: MapeamentoProduto[] | null = null;
let sinonimosBanco: SinonimoBanco[] | null = null;
let produtosBanco: ProdutoBanco[] | null = null;

// Carrega sinônimos do banco de dados
const carregarSinonimosBanco = async (): Promise<SinonimoBanco[]> => {
  if (sinonimosBanco) {
    return sinonimosBanco;
  }

  try {
    const { data, error } = await supabase
      .from('sinonimos_produto')
      .select(`
        id,
        sinonimo,
        produto_id
      `);

    if (error) {
      console.error('Erro ao carregar sinônimos:', error);
      return [];
    }

    sinonimosBanco = data || [];
    console.log(`${sinonimosBanco.length} sinônimos carregados do banco.`);
    return sinonimosBanco;
  } catch (error) {
    console.error('Erro ao carregar sinônimos:', error);
    return [];
  }
};

// Carrega produtos do banco de dados
const carregarProdutosBanco = async (): Promise<ProdutoBanco[]> => {
  if (produtosBanco) {
    return produtosBanco;
  }

  try {
    const { data, error } = await supabase
      .from('produtos')
      .select('id, produto, nome_variacao, nome_base')
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
    }

    produtosBanco = data || [];
    console.log(`${produtosBanco.length} produtos carregados do banco.`);
    return produtosBanco;
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
    return [];
  }
};

// Função que cria e armazena em cache uma versão otimizada do dicionário
const getDicionarioOtimizado = (): MapeamentoProduto[] => {
  if (dicionarioOtimizado) {
    return dicionarioOtimizado;
  }

  const listaMapeamentos: MapeamentoProduto[] = [];

  for (const [nomeProduto, tipos] of Object.entries(dicionarioProdutos)) {
    for (const [nomeTipo, aliases] of Object.entries(tipos)) {
      for (const alias of aliases) {
        listaMapeamentos.push({
          alias: alias.toLowerCase(),
          produto: nomeProduto,
          tipo: nomeTipo,
        });
      }
    }
  }

  // Ordena por comprimento do alias, do maior para o menor
  listaMapeamentos.sort((a, b) => b.alias.length - a.alias.length);
  
  dicionarioOtimizado = listaMapeamentos;
  return dicionarioOtimizado;
};

// Busca produto no dicionário local
const buscarNoDicionario = (linhaNormalizada: string): { produto: string; tipo: string; alias: string; } | null => {
  const dicionario = getDicionarioOtimizado();
  
  for (const mapeamento of dicionario) {
    if (linhaNormalizada.includes(mapeamento.alias)) {
      return {
        produto: mapeamento.produto,
        tipo: mapeamento.tipo,
        alias: mapeamento.alias,
      };
    }
  }
  
  return null;
};

// Busca produto nos sinônimos do banco
const buscarNosSinonimos = async (linhaNormalizada: string): Promise<{ produto: string; tipo: string; alias: string; produtoId: string; } | null> => {
  if (!linhaNormalizada || typeof linhaNormalizada !== 'string') {
    return null;
  }

  const sinonimos = await carregarSinonimosBanco();
  const produtos = await carregarProdutosBanco();
  
  if (!sinonimos || !produtos || sinonimos.length === 0) {
    return null;
  }
  
  // Ordena sinônimos por comprimento para buscar o mais específico primeiro
  const sinonimosPorTamanho = sinonimos
    .filter(s => s.sinonimo && typeof s.sinonimo === 'string')
    .map(s => ({ ...s, sinonimo: s.sinonimo.toLowerCase().trim() }))
    .filter(s => s.sinonimo.length > 0)
    .sort((a, b) => b.sinonimo.length - a.sinonimo.length);
  
  for (const sinonimo of sinonimosPorTamanho) {
    if (linhaNormalizada.includes(sinonimo.sinonimo)) {
      const produto = produtos.find(p => p.id === sinonimo.produto_id);
      if (produto) {
        return {
          produto: produto.nome_base || produto.produto || 'Produto',
          tipo: produto.nome_variacao || 'padrão',
          alias: sinonimo.sinonimo,
          produtoId: produto.id
        };
      }
    }
  }
  
  return null;
};

// Processa linha extraindo produto e preço
const processarLinha = async (linha: string, nomeFornecedor: string): Promise<ProdutoExtraido | null> => {
  if (!linha || typeof linha !== 'string' || linha.trim().length === 0) {
    return null;
  }
  
  const linhaNormalizada = linha.toLowerCase().trim();
  
  // Busca preço (opcional)
  const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
  const precos = linha.match(regexPreco);
  const preco = precos ? parseFloat(precos[precos.length - 1].replace(',', '.')) : null;
  
  // 1. Busca no dicionário primeiro
  let produtoEncontrado = buscarNoDicionario(linhaNormalizada);
  if (produtoEncontrado) {
    // Tenta refinar com consulta ao banco
    const refinamento = await refinarIdentificacaoProduto(
      produtoEncontrado.produto,
      produtoEncontrado.tipo,
      linha
    );
    
    if (refinamento) {
      console.log(`Refinamento aplicado: ${refinamento.produto} - ${refinamento.tipo} (confiança: ${refinamento.confianca.toFixed(2)})`);
      return {
        produto: (refinamento.produto || 'Produto').charAt(0).toUpperCase() + (refinamento.produto || 'Produto').slice(1),
        tipo: (refinamento.tipo || 'padrão').charAt(0).toUpperCase() + (refinamento.tipo || 'padrão').slice(1),
        preco,
        fornecedor: nomeFornecedor,
        linhaOriginal: linha,
        aliasUsado: produtoEncontrado.alias,
        produtoId: refinamento.produtoId,
        origem: 'banco',
        confianca: refinamento.confianca,
        id: `${nomeFornecedor}-${Date.now()}-${Math.random()}`
      };
    }
    
    // Fallback para resultado do dicionário
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

    return {
      produto: (produtoEncontrado.produto || 'Produto').charAt(0).toUpperCase() + (produtoEncontrado.produto || 'Produto').slice(1),
      tipo: (tipoFinal || 'padrão').charAt(0).toUpperCase() + (tipoFinal || 'padrão').slice(1),
      preco,
      fornecedor: nomeFornecedor,
      linhaOriginal: linha,
      aliasUsado: produtoEncontrado.alias,
      origem: 'dicionario',
      confianca: 0.9,
      id: `${nomeFornecedor}-${Date.now()}-${Math.random()}`
    };
  }
  
  // 2. Busca nos sinônimos do banco
  const sinonimo = await buscarNosSinonimos(linhaNormalizada);
  if (sinonimo) {
    return {
      produto: (sinonimo.produto || 'Produto').charAt(0).toUpperCase() + (sinonimo.produto || 'Produto').slice(1),
      tipo: (sinonimo.tipo || 'padrão').charAt(0).toUpperCase() + (sinonimo.tipo || 'padrão').slice(1),
      preco,
      fornecedor: nomeFornecedor,
      linhaOriginal: linha,
      aliasUsado: sinonimo.alias,
      produtoId: sinonimo.produtoId,
      origem: 'sinonimo',
      confianca: 0.8,
      id: `${nomeFornecedor}-${Date.now()}-${Math.random()}`
    };
  }
  
  // 3. Se tem preço mas não identificou produto, tenta fallback
  if (preco !== null) {
    const fallbackResult = await aplicarFallback(linha, nomeFornecedor);
    if (fallbackResult) {
      return fallbackResult;
    }
  }
  
  // 4. Última tentativa - mesmo sem preço, tenta fallback
  const ultimoFallback = await aplicarFallback(linha, nomeFornecedor);
  if (ultimoFallback) {
    return ultimoFallback;
  }
  
  return null;
};

// Variável para controlar se a migração já foi executada nesta sessão
let migracaoExecutada = false;

export const extrairProdutosAvancado = async (mensagem: string, nomeFornecedor: string): Promise<ProdutoExtraido[]> => {
  if (!mensagem || typeof mensagem !== 'string' || !nomeFornecedor) {
    console.log('❌ Mensagem ou fornecedor inválidos');
    return [];
  }

  // Verificar se a migração foi feita apenas uma vez por sessão
  if (!migracaoExecutada) {
    const { count } = await supabase
      .from('sinonimos_produto')
      .select('*', { count: 'exact', head: true });
    
    if (!count || count === 0) {
      console.log('🔄 Executando migração do dicionário...');
      try {
        await migrarDicionarioParaSinonimos();
        migracaoExecutada = true;
      } catch (error) {
        console.error('Erro na migração:', error);
      }
    } else {
      migracaoExecutada = true;
    }
  }

  const linhas = mensagem.split('\n').filter(linha => linha && linha.trim() !== '');
  const produtos: ProdutoExtraido[] = [];
  
  console.log(`🔍 Processando ${linhas.length} linhas para fornecedor ${nomeFornecedor}`);
  
  // Processa com debounce para evitar loops
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    try {
      // Pequeno delay para evitar sobrecarga
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const produto = await processarLinha(linha, nomeFornecedor);
      if (produto) {
        produtos.push(produto);
        console.log(`✅ Produto extraído: ${produto.produto} - ${produto.tipo} (${produto.origem})`);
      } else {
        console.log(`⚠️ Linha não identificada: ${linha}`);
      }
    } catch (error) {
      console.error('❌ Erro ao processar linha:', linha, error);
    }
  }
  
  console.log(`📊 ${produtos.length} produtos extraídos de ${linhas.length} linhas`);
  
  // Atualiza métricas de qualidade
  try {
    fallbackSystem.updateQualityMetrics(produtos);
    
    // Verifica se precisa de alerta
    if (fallbackSystem.shouldTriggerAlert()) {
      console.warn('⚠️ Qualidade de extração abaixo do esperado');
      console.log(fallbackSystem.generateQualityReport());
    }
  } catch (error) {
    console.error('Erro ao atualizar métricas:', error);
  }
  
  return produtos;
};

// Re-exporta a função de migração do novo serviço
export { migrarDicionarioParaSinonimos, verificarStatusMigracao } from './migrationService';