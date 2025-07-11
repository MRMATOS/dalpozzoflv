import { supabase } from '@/integrations/supabase/client';
import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { refinarIdentificacaoProduto } from './refinementService';
import { aplicarFallback, fallbackSystem } from './fallbackSystem';

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
  const sinonimos = await carregarSinonimosBanco();
  const produtos = await carregarProdutosBanco();
  
  // Ordena sinônimos por comprimento para buscar o mais específico primeiro
  const sinonimosPorTamanho = sinonimos
    .map(s => ({ ...s, sinonimo: s.sinonimo.toLowerCase() }))
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
  const linhaNormalizada = linha.toLowerCase();
  
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
        produto: refinamento.produto.charAt(0).toUpperCase() + refinamento.produto.slice(1),
        tipo: refinamento.tipo.charAt(0).toUpperCase() + refinamento.tipo.slice(1),
        preco,
        fornecedor: nomeFornecedor,
        linhaOriginal: linha,
        aliasUsado: produtoEncontrado.alias,
        produtoId: refinamento.produtoId,
        origem: 'banco',
        confianca: refinamento.confianca
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
      produto: produtoEncontrado.produto.charAt(0).toUpperCase() + produtoEncontrado.produto.slice(1),
      tipo: tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
      preco,
      fornecedor: nomeFornecedor,
      linhaOriginal: linha,
      aliasUsado: produtoEncontrado.alias,
      origem: 'dicionario',
      confianca: 0.9
    };
  }
  
  // 2. Busca nos sinônimos do banco
  const sinonimo = await buscarNosSinonimos(linhaNormalizada);
  if (sinonimo) {
    return {
      produto: sinonimo.produto.charAt(0).toUpperCase() + sinonimo.produto.slice(1),
      tipo: sinonimo.tipo.charAt(0).toUpperCase() + sinonimo.tipo.slice(1),
      preco,
      fornecedor: nomeFornecedor,
      linhaOriginal: linha,
      aliasUsado: sinonimo.alias,
      produtoId: sinonimo.produtoId,
      origem: 'sinonimo',
      confianca: 0.8
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

export const extrairProdutosAvancado = async (mensagem: string, nomeFornecedor: string): Promise<ProdutoExtraido[]> => {
  const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
  const produtos: ProdutoExtraido[] = [];
  
  console.log(`Processando ${linhas.length} linhas para fornecedor ${nomeFornecedor}`);
  
  for (const linha of linhas) {
    try {
      const produto = await processarLinha(linha, nomeFornecedor);
      if (produto) {
        produtos.push(produto);
      }
    } catch (error) {
      console.error('Erro ao processar linha:', linha, error);
    }
  }
  
  console.log(`${produtos.length} produtos extraídos (incluindo não identificados)`);
  
  // Atualiza métricas de qualidade
  fallbackSystem.updateQualityMetrics(produtos);
  
  // Verifica se precisa de alerta
  if (fallbackSystem.shouldTriggerAlert()) {
    console.warn('⚠️ Qualidade de extração abaixo do esperado');
    console.log(fallbackSystem.generateQualityReport());
  }
  
  return produtos;
};

// Função para popular tabela de sinônimos com dados do dicionário
export const migrarDicionarioParaSinonimos = async (): Promise<void> => {
  try {
    console.log('Iniciando migração do dicionário para sinônimos...');
    
    const produtos = await carregarProdutosBanco();
    const dicionario = getDicionarioOtimizado();
    
    const sinonimosPararInserir: { produto_id: string; sinonimo: string }[] = [];
    
    for (const mapeamento of dicionario) {
      // Encontra produto correspondente no banco
      const produto = produtos.find(p => 
        (p.nome_base?.toLowerCase() === mapeamento.produto.toLowerCase()) ||
        (p.produto?.toLowerCase() === mapeamento.produto.toLowerCase())
      );
      
      if (produto) {
        sinonimosPararInserir.push({
          produto_id: produto.id,
          sinonimo: mapeamento.alias
        });
      }
    }
    
    console.log(`Inserindo ${sinonimosPararInserir.length} sinônimos...`);
    
    // Insere em lotes para evitar timeout
    const batchSize = 100;
    for (let i = 0; i < sinonimosPararInserir.length; i += batchSize) {
      const batch = sinonimosPararInserir.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('sinonimos_produto')
        .insert(batch);
      
      if (error) {
        console.error('Erro ao inserir batch de sinônimos:', error);
      } else {
        console.log(`Batch ${Math.floor(i/batchSize) + 1} inserido com sucesso`);
      }
    }
    
    // Limpa cache para recarregar
    sinonimosBanco = null;
    
    console.log('Migração concluída!');
  } catch (error) {
    console.error('Erro na migração:', error);
  }
};