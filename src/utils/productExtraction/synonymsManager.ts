// ========================================
// FASE 3: SISTEMA DE SINÔNIMOS ROBUSTO
// ========================================
// Gerenciamento automático de sinônimos do dicionário no banco de dados

import { supabase } from '@/integrations/supabase/client';
import { dicionarioProdutos } from './dicionarioProdutos';

// Interface para sinônimo do banco
interface SinonimoBanco {
  id: string;
  sinonimo: string;
  produto_id: string;
}

// Interface para produto do banco
interface ProdutoBanco {
  id: string;
  produto: string;
  nome_base: string | null;
  nome_variacao: string | null;
  ativo: boolean;
}

// Função para normalizar texto para comparação
const normalizeForComparison = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais
    .replace(/\s+/g, ' ')
    .trim();
};

// Função para encontrar produto no banco por nome
const encontrarProdutoNoBanco = async (nomeProduto: string, nomeVariacao?: string): Promise<ProdutoBanco | null> => {
  try {
    console.log(`🔍 [Sinônimos] Buscando produto: "${nomeProduto}" variação: "${nomeVariacao || 'N/A'}"`);
    
    const { data: produtos, error } = await supabase
      .from('produtos')
      .select('id, produto, nome_base, nome_variacao, ativo')
      .eq('ativo', true);
    
    if (error) {
      console.error('❌ [Sinônimos] Erro ao buscar produtos:', error);
      return null;
    }
    
    if (!produtos || produtos.length === 0) {
      console.log('⚠️ [Sinônimos] Nenhum produto encontrado no banco');
      return null;
    }
    
    const nomeProdutoNorm = normalizeForComparison(nomeProduto);
    const nomeVariacaoNorm = nomeVariacao ? normalizeForComparison(nomeVariacao) : null;
    
    // Primeiro, tentar encontrar variação específica
    if (nomeVariacaoNorm && nomeVariacaoNorm !== 'padrao') {
      for (const produto of produtos) {
        if (!produto.nome_variacao) continue;
        
        const produtoBaseNorm = normalizeForComparison(produto.nome_base || '');
        const variacaoNorm = normalizeForComparison(produto.nome_variacao);
        
        // Match por nome base + variação
        if (produtoBaseNorm.includes(nomeProdutoNorm) && variacaoNorm.includes(nomeVariacaoNorm)) {
          console.log(`✅ [Sinônimos] Variação encontrada: ${produto.produto} (ID: ${produto.id})`);
          return produto;
        }
      }
    }
    
    // Fallback: buscar produto pai
    for (const produto of produtos) {
      const produtoNorm = normalizeForComparison(produto.produto || '');
      const nomeBaseNorm = normalizeForComparison(produto.nome_base || '');
      
      if (produtoNorm.includes(nomeProdutoNorm) || nomeBaseNorm.includes(nomeProdutoNorm)) {
        console.log(`✅ [Sinônimos] Produto pai encontrado: ${produto.produto} (ID: ${produto.id})`);
        return produto;
      }
    }
    
    console.log(`❌ [Sinônimos] Produto não encontrado: "${nomeProduto}"`);
    return null;
    
  } catch (error) {
    console.error('❌ [Sinônimos] Erro na busca:', error);
    return null;
  }
};

// Função para sincronizar sinônimos do dicionário com o banco
export const sincronizarSinonimosDicionario = async (): Promise<{
  adicionados: number;
  erros: number;
  detalhes: Array<{ produto: string; variacao: string; status: string; }>
}> => {
  console.log('🔄 [Sinônimos] Iniciando sincronização do dicionário...');
  
  let adicionados = 0;
  let erros = 0;
  const detalhes: Array<{ produto: string; variacao: string; status: string; }> = [];
  
  try {
    // Carregar sinônimos existentes para evitar duplicatas
    const { data: sinonimosExistentes, error: errorSinonimos } = await supabase
      .from('sinonimos_produto')
      .select('sinonimo, produto_id');
    
    if (errorSinonimos) {
      console.error('❌ [Sinônimos] Erro ao carregar sinônimos existentes:', errorSinonimos);
      return { adicionados: 0, erros: 1, detalhes: [{ produto: 'Sistema', variacao: '', status: 'Erro ao carregar sinônimos' }] };
    }
    
    const sinonimosSet = new Set(
      (sinonimosExistentes || []).map(s => `${normalizeForComparison(s.sinonimo)}_${s.produto_id}`)
    );
    
    console.log(`📊 [Sinônimos] ${sinonimosSet.size} sinônimos já existem no banco`);
    
    // Processar cada produto do dicionário
    for (const [nomeProduto, variacoes] of Object.entries(dicionarioProdutos)) {
      for (const [nomeVariacao, aliases] of Object.entries(variacoes)) {
        try {
          // Encontrar produto correspondente no banco
          const produtoBanco = await encontrarProdutoNoBanco(nomeProduto, nomeVariacao);
          
          if (!produtoBanco) {
            detalhes.push({
              produto: nomeProduto,
              variacao: nomeVariacao,
              status: 'Produto não encontrado no banco'
            });
            continue;
          }
          
          // Adicionar sinônimos para este produto
          const sinonimosParaAdicionar: Array<{ sinonimo: string; produto_id: string }> = [];
          
          for (const alias of aliases) {
            const aliasNorm = normalizeForComparison(alias);
            const chaveUnica = `${aliasNorm}_${produtoBanco.id}`;
            
            // Verificar se já existe
            if (!sinonimosSet.has(chaveUnica)) {
              sinonimosParaAdicionar.push({
                sinonimo: alias,
                produto_id: produtoBanco.id
              });
              sinonimosSet.add(chaveUnica); // Adicionar ao set para evitar duplicatas na mesma execução
            }
          }
          
          // Inserir em lote se houver sinônimos para adicionar
          if (sinonimosParaAdicionar.length > 0) {
            const { error: insertError } = await supabase
              .from('sinonimos_produto')
              .insert(sinonimosParaAdicionar);
            
            if (insertError) {
              console.error(`❌ [Sinônimos] Erro ao inserir sinônimos para ${nomeProduto} ${nomeVariacao}:`, insertError);
              erros++;
              detalhes.push({
                produto: nomeProduto,
                variacao: nomeVariacao,
                status: `Erro: ${insertError.message}`
              });
            } else {
              adicionados += sinonimosParaAdicionar.length;
              detalhes.push({
                produto: nomeProduto,
                variacao: nomeVariacao,
                status: `✅ ${sinonimosParaAdicionar.length} sinônimos adicionados`
              });
              console.log(`✅ [Sinônimos] ${sinonimosParaAdicionar.length} sinônimos adicionados para ${produtoBanco.produto}`);
            }
          } else {
            detalhes.push({
              produto: nomeProduto,
              variacao: nomeVariacao,
              status: 'Sinônimos já existem'
            });
          }
          
        } catch (error) {
          console.error(`❌ [Sinônimos] Erro ao processar ${nomeProduto} ${nomeVariacao}:`, error);
          erros++;
          detalhes.push({
            produto: nomeProduto,
            variacao: nomeVariacao,
            status: `Erro: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
    }
    
    console.log(`🎯 [Sinônimos] Sincronização concluída: ${adicionados} adicionados, ${erros} erros`);
    return { adicionados, erros, detalhes };
    
  } catch (error) {
    console.error('❌ [Sinônimos] Erro geral na sincronização:', error);
    return { 
      adicionados: 0, 
      erros: 1, 
      detalhes: [{ produto: 'Sistema', variacao: '', status: `Erro geral: ${error instanceof Error ? error.message : String(error)}` }] 
    };
  }
};

// Função para limpar sinônimos órfãos (sem produto correspondente)
export const limparSinonimosOrfaos = async (): Promise<{
  removidos: number;
  detalhes: Array<{ sinonimo: string; status: string }>
}> => {
  console.log('🧹 [Sinônimos] Iniciando limpeza de sinônimos órfãos...');
  
  try {
    // Buscar sinônimos com produtos inativos ou inexistentes
    const { data: sinonimosOrfaos, error } = await supabase
      .from('sinonimos_produto')
      .select(`
        id,
        sinonimo,
        produto_id,
        produtos!inner(id, ativo)
      `)
      .eq('produtos.ativo', false);
    
    if (error) {
      console.error('❌ [Sinônimos] Erro ao buscar sinônimos órfãos:', error);
      return { removidos: 0, detalhes: [] };
    }
    
    if (!sinonimosOrfaos || sinonimosOrfaos.length === 0) {
      console.log('✅ [Sinônimos] Nenhum sinônimo órfão encontrado');
      return { removidos: 0, detalhes: [] };
    }
    
    const idsParaRemover = sinonimosOrfaos.map(s => s.id);
    
    // Remover sinônimos órfãos
    const { error: deleteError } = await supabase
      .from('sinonimos_produto')
      .delete()
      .in('id', idsParaRemover);
    
    if (deleteError) {
      console.error('❌ [Sinônimos] Erro ao remover sinônimos órfãos:', deleteError);
      return { removidos: 0, detalhes: [] };
    }
    
    const detalhes = sinonimosOrfaos.map(s => ({
      sinonimo: s.sinonimo,
      status: 'Removido (produto inativo)'
    }));
    
    console.log(`✅ [Sinônimos] ${sinonimosOrfaos.length} sinônimos órfãos removidos`);
    return { removidos: sinonimosOrfaos.length, detalhes };
    
  } catch (error) {
    console.error('❌ [Sinônimos] Erro na limpeza:', error);
    return { removidos: 0, detalhes: [] };
  }
};

// Função para auditoria completa do sistema de sinônimos
export const auditarSinonimos = async (): Promise<{
  totalSinonimos: number;
  produtosComSinonimos: number;
  produtosSemSinonimos: number;
  sinonimosOrfaos: number;
  estatisticas: Array<{ produto: string; totalSinonimos: number }>
}> => {
  console.log('📊 [Sinônimos] Iniciando auditoria...');
  
  try {
    // Contar sinônimos totais
    const { count: totalSinonimos, error: errorTotal } = await supabase
      .from('sinonimos_produto')
      .select('*', { count: 'exact', head: true });
    
    if (errorTotal) {
      console.error('❌ [Sinônimos] Erro ao contar sinônimos:', errorTotal);
      return { totalSinonimos: 0, produtosComSinonimos: 0, produtosSemSinonimos: 0, sinonimosOrfaos: 0, estatisticas: [] };
    }
    
    // Estatísticas por produto
    const { data: estatisticasProdutos, error: errorStats } = await supabase
      .from('produtos')
      .select(`
        produto,
        sinonimos_produto(count)
      `)
      .eq('ativo', true);
    
    if (errorStats) {
      console.error('❌ [Sinônimos] Erro ao buscar estatísticas:', errorStats);
    }
    
    const produtosComSinonimos = (estatisticasProdutos || []).filter(p => p.sinonimos_produto && p.sinonimos_produto.length > 0).length;
    const produtosSemSinonimos = (estatisticasProdutos || []).filter(p => !p.sinonimos_produto || p.sinonimos_produto.length === 0).length;
    
    const estatisticas = (estatisticasProdutos || [])
      .filter(p => p.sinonimos_produto && p.sinonimos_produto.length > 0)
      .map(p => ({
        produto: p.produto || 'Produto sem nome',
        totalSinonimos: p.sinonimos_produto ? p.sinonimos_produto.length : 0
      }))
      .sort((a, b) => b.totalSinonimos - a.totalSinonimos);
    
    console.log(`📊 [Sinônimos] Auditoria concluída: ${totalSinonimos || 0} sinônimos, ${produtosComSinonimos} produtos com sinônimos`);
    
    return {
      totalSinonimos: totalSinonimos || 0,
      produtosComSinonimos,
      produtosSemSinonimos,
      sinonimosOrfaos: 0, // Calculado separadamente se necessário
      estatisticas
    };
    
  } catch (error) {
    console.error('❌ [Sinônimos] Erro na auditoria:', error);
    return { totalSinonimos: 0, produtosComSinonimos: 0, produtosSemSinonimos: 0, sinonimosOrfaos: 0, estatisticas: [] };
  }
};

// Função para executar manutenção completa do sistema de sinônimos
export const manutencaoCompletaSinonimos = async (): Promise<{
  sincronizacao: Awaited<ReturnType<typeof sincronizarSinonimosDicionario>>;
  limpeza: Awaited<ReturnType<typeof limparSinonimosOrfaos>>;
  auditoria: Awaited<ReturnType<typeof auditarSinonimos>>;
}> => {
  console.log('🔧 [Sinônimos] Iniciando manutenção completa...');
  
  // 1. Sincronizar sinônimos do dicionário
  const sincronizacao = await sincronizarSinonimosDicionario();
  
  // 2. Limpar sinônimos órfãos
  const limpeza = await limparSinonimosOrfaos();
  
  // 3. Auditoria final
  const auditoria = await auditarSinonimos();
  
  console.log('✅ [Sinônimos] Manutenção completa finalizada');
  
  return { sincronizacao, limpeza, auditoria };
};