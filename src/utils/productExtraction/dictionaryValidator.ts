// ========================================
// FASE 3: VALIDAÇÃO E CORREÇÃO DO DICIONÁRIO
// ========================================
// Sistema de auditoria para identificar problemas no dicionário

import { dicionarioProdutos } from './dicionarioProdutos';
import { supabase } from '@/integrations/supabase/client';

// Interface para problemas encontrados
interface ProblemaValidacao {
  tipo: 'produto_sem_padrao' | 'alias_duplicado' | 'produto_inexistente' | 'alias_muito_generico' | 'inconsistencia_variacao';
  produto: string;
  variacao?: string;
  descricao: string;
  sugestao?: string;
  aliases?: string[];
}

// Interface para estatísticas do dicionário
interface EstatisticasDicionario {
  totalProdutos: number;
  totalVariacoes: number;
  totalAliases: number;
  produtosSemPadrao: number;
  produtosComVariacoesGenericas: number;
  mediaAliasesPorVariacao: number;
}

// Função para normalizar texto para comparação
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Lista de aliases muito genéricos que podem causar problemas
const ALIASES_GENERICOS = [
  'kg', 'comum', 'padrão', 'padrao', 'graúdo', 'graudo', 'médio', 'medio', 
  'grande', 'pequeno', 'top', 'especial', 'nacional', 'importado', 'cx', 'caixa'
];

// Validar se um alias é muito genérico
const isAliasGenerico = (alias: string): boolean => {
  const aliasNorm = normalizeText(alias);
  return ALIASES_GENERICOS.some(generico => aliasNorm === generico || aliasNorm.endsWith(` ${generico}`));
};

// Função principal de validação do dicionário
export const validarDicionario = (): {
  problemas: ProblemaValidacao[];
  estatisticas: EstatisticasDicionario;
  recomendacoes: string[];
} => {
  console.log('🔍 [Validação] Iniciando auditoria do dicionário...');
  
  const problemas: ProblemaValidacao[] = [];
  const aliasesVistos = new Map<string, { produto: string; variacao: string }>();
  
  let totalProdutos = 0;
  let totalVariacoes = 0;
  let totalAliases = 0;
  let produtosSemPadrao = 0;
  let produtosComVariacoesGenericas = 0;
  
  // Verificar cada produto no dicionário
  for (const [nomeProduto, variacoes] of Object.entries(dicionarioProdutos)) {
    totalProdutos++;
    const varicoesArray = Object.entries(variacoes);
    totalVariacoes += varicoesArray.length;
    
    // Verificar se produto tem variação "padrão"
    const temPadrao = varicoesArray.some(([variacao]) => 
      normalizeText(variacao) === 'padrao'
    );
    
    if (!temPadrao && varicoesArray.length > 1) {
      produtosSemPadrao++;
      problemas.push({
        tipo: 'produto_sem_padrao',
        produto: nomeProduto,
        descricao: `Produto com múltiplas variações mas sem variação "padrão"`,
        sugestao: `Adicionar variação "padrão" com aliases genéricos do produto`
      });
    }
    
    // Verificar variações genéricas
    const temVariacaoGenerica = varicoesArray.some(([variacao]) => 
      ['padrao', 'comum', 'kg'].includes(normalizeText(variacao))
    );
    
    if (temVariacaoGenerica) {
      produtosComVariacoesGenericas++;
    }
    
    // Verificar cada variação
    for (const [nomeVariacao, aliases] of varicoesArray) {
      totalAliases += aliases.length;
      
      // Verificar aliases duplicados entre produtos diferentes
      for (const alias of aliases) {
        const aliasNorm = normalizeText(alias);
        
        if (aliasesVistos.has(aliasNorm)) {
          const anterior = aliasesVistos.get(aliasNorm)!;
          if (anterior.produto !== nomeProduto) {
            problemas.push({
              tipo: 'alias_duplicado',
              produto: nomeProduto,
              variacao: nomeVariacao,
              descricao: `Alias "${alias}" duplicado com ${anterior.produto} ${anterior.variacao}`,
              sugestao: `Tornar o alias mais específico ou remover duplicata`,
              aliases: [alias]
            });
          }
        } else {
          aliasesVistos.set(aliasNorm, { produto: nomeProduto, variacao: nomeVariacao });
        }
        
        // Verificar aliases muito genéricos
        if (isAliasGenerico(alias) && aliases.length === 1) {
          problemas.push({
            tipo: 'alias_muito_generico',
            produto: nomeProduto,
            variacao: nomeVariacao,
            descricao: `Alias muito genérico "${alias}" como única opção`,
            sugestao: `Adicionar aliases mais específicos`,
            aliases: [alias]
          });
        }
      }
      
      // Verificar inconsistências na variação
      if (nomeVariacao !== 'padrão') {
        const variacaoTemNomeProduto = aliases.some(alias => 
          normalizeText(alias).includes(normalizeText(nomeProduto))
        );
        
        if (!variacaoTemNomeProduto && aliases.length > 1) {
          problemas.push({
            tipo: 'inconsistencia_variacao',
            produto: nomeProduto,
            variacao: nomeVariacao,
            descricao: `Variação "${nomeVariacao}" não possui aliases que incluam o nome do produto`,
            sugestao: `Adicionar alias como "${nomeProduto} ${nomeVariacao}"`,
            aliases: aliases
          });
        }
      }
    }
  }
  
  const estatisticas: EstatisticasDicionario = {
    totalProdutos,
    totalVariacoes,
    totalAliases,
    produtosSemPadrao,
    produtosComVariacoesGenericas,
    mediaAliasesPorVariacao: totalVariacoes > 0 ? totalAliases / totalVariacoes : 0
  };
  
  // Gerar recomendações baseadas nos problemas encontrados
  const recomendacoes: string[] = [];
  
  if (produtosSemPadrao > 0) {
    recomendacoes.push(`📝 Adicionar variação "padrão" a ${produtosSemPadrao} produtos`);
  }
  
  const aliasesDuplicados = problemas.filter(p => p.tipo === 'alias_duplicado').length;
  if (aliasesDuplicados > 0) {
    recomendacoes.push(`🔄 Resolver ${aliasesDuplicados} aliases duplicados`);
  }
  
  const aliasesGenericos = problemas.filter(p => p.tipo === 'alias_muito_generico').length;
  if (aliasesGenericos > 0) {
    recomendacoes.push(`⚡ Melhorar ${aliasesGenericos} aliases muito genéricos`);
  }
  
  if (estatisticas.mediaAliasesPorVariacao < 2) {
    recomendacoes.push(`📈 Aumentar número médio de aliases por variação (atual: ${estatisticas.mediaAliasesPorVariacao.toFixed(1)})`);
  }
  
  console.log(`✅ [Validação] Auditoria concluída: ${problemas.length} problemas encontrados`);
  
  return { problemas, estatisticas, recomendacoes };
};

// Função para verificar quais produtos do dicionário existem no banco
export const verificarProdutosNoBanco = async (): Promise<{
  produtosEncontrados: Array<{ produto: string; variacoes: string[] }>;
  produtosNaoEncontrados: Array<{ produto: string; variacoes: string[] }>;
  estatisticas: { totalDicionario: number; encontrados: number; naoEncontrados: number };
}> => {
  console.log('🔍 [Validação] Verificando produtos do dicionário no banco...');
  
  try {
    // Buscar todos os produtos ativos no banco
    const { data: produtosBanco, error } = await supabase
      .from('produtos')
      .select('produto, nome_base, nome_variacao, ativo')
      .eq('ativo', true);
    
    if (error) {
      console.error('❌ [Validação] Erro ao buscar produtos do banco:', error);
      return { 
        produtosEncontrados: [], 
        produtosNaoEncontrados: [], 
        estatisticas: { totalDicionario: 0, encontrados: 0, naoEncontrados: 0 } 
      };
    }
    
    const produtosEncontrados: Array<{ produto: string; variacoes: string[] }> = [];
    const produtosNaoEncontrados: Array<{ produto: string; variacoes: string[] }> = [];
    
    // Verificar cada produto do dicionário
    for (const [nomeProduto, variacoes] of Object.entries(dicionarioProdutos)) {
      const nomeProdutoNorm = normalizeText(nomeProduto);
      
      // Verificar se existe no banco
      const produtoExiste = produtosBanco?.some(p => {
        const produtoNorm = normalizeText(p.produto || '');
        const nomeBaseNorm = normalizeText(p.nome_base || '');
        return produtoNorm.includes(nomeProdutoNorm) || nomeBaseNorm.includes(nomeProdutoNorm);
      });
      
      const varicoesLista = Object.keys(variacoes);
      
      if (produtoExiste) {
        produtosEncontrados.push({ produto: nomeProduto, variacoes: varicoesLista });
      } else {
        produtosNaoEncontrados.push({ produto: nomeProduto, variacoes: varicoesLista });
      }
    }
    
    const estatisticas = {
      totalDicionario: Object.keys(dicionarioProdutos).length,
      encontrados: produtosEncontrados.length,
      naoEncontrados: produtosNaoEncontrados.length
    };
    
    console.log(`✅ [Validação] Verificação concluída: ${estatisticas.encontrados}/${estatisticas.totalDicionario} produtos encontrados no banco`);
    
    return { produtosEncontrados, produtosNaoEncontrados, estatisticas };
    
  } catch (error) {
    console.error('❌ [Validação] Erro na verificação:', error);
    return { 
      produtosEncontrados: [], 
      produtosNaoEncontrados: [], 
      estatisticas: { totalDicionario: 0, encontrados: 0, naoEncontrados: 0 } 
    };
  }
};

// Função para sugerir correções automáticas
export const sugerirCorrecoes = (problemas: ProblemaValidacao[]): Array<{
  problema: ProblemaValidacao;
  correcaoSugerida: string;
  codigo: string;
}> => {
  const sugestoes: Array<{
    problema: ProblemaValidacao;
    correcaoSugerida: string;
    codigo: string;
  }> = [];
  
  for (const problema of problemas) {
    let correcaoSugerida = '';
    let codigo = '';
    
    switch (problema.tipo) {
      case 'produto_sem_padrao':
        correcaoSugerida = `Adicionar variação "padrão" ao produto ${problema.produto}`;
        codigo = `'${problema.produto}': {\n  'padrão': ['${problema.produto}', '${problema.produto} kg', '${problema.produto} comum'],\n  // ... outras variações\n}`;
        break;
        
      case 'alias_duplicado':
        correcaoSugerida = `Tornar alias "${problema.aliases?.[0]}" mais específico`;
        codigo = `// Trocar "${problema.aliases?.[0]}" por "${problema.produto} ${problema.aliases?.[0]}"`;
        break;
        
      case 'alias_muito_generico':
        correcaoSugerida = `Adicionar aliases mais específicos para ${problema.produto} ${problema.variacao}`;
        codigo = `'${problema.variacao}': ['${problema.produto} ${problema.variacao}', '${problema.aliases?.[0]}']`;
        break;
        
      case 'inconsistencia_variacao':
        correcaoSugerida = `Adicionar alias com nome do produto para variação ${problema.variacao}`;
        codigo = `'${problema.variacao}': [...aliases_existentes, '${problema.produto} ${problema.variacao}']`;
        break;
    }
    
    sugestoes.push({ problema, correcaoSugerida, codigo });
  }
  
  return sugestoes;
};

// Função para executar auditoria completa do dicionário
export const auditoriaCompletaDicionario = async (): Promise<{
  validacao: ReturnType<typeof validarDicionario>;
  verificacaoBanco: Awaited<ReturnType<typeof verificarProdutosNoBanco>>;
  sugestoes: ReturnType<typeof sugerirCorrecoes>;
  relatorio: string;
}> => {
  console.log('📊 [Auditoria] Iniciando auditoria completa do dicionário...');
  
  // 1. Validar estrutura do dicionário
  const validacao = validarDicionario();
  
  // 2. Verificar produtos no banco
  const verificacaoBanco = await verificarProdutosNoBanco();
  
  // 3. Gerar sugestões de correção
  const sugestoes = sugerirCorrecoes(validacao.problemas);
  
  // 4. Gerar relatório resumido
  const relatorio = `
🔍 RELATÓRIO DE AUDITORIA DO DICIONÁRIO

📊 ESTATÍSTICAS:
- Total de produtos: ${validacao.estatisticas.totalProdutos}
- Total de variações: ${validacao.estatisticas.totalVariacoes}
- Total de aliases: ${validacao.estatisticas.totalAliases}
- Média de aliases por variação: ${validacao.estatisticas.mediaAliasesPorVariacao.toFixed(1)}

🗄️ VERIFICAÇÃO NO BANCO:
- Produtos encontrados: ${verificacaoBanco.estatisticas.encontrados}/${verificacaoBanco.estatisticas.totalDicionario}
- Produtos não encontrados: ${verificacaoBanco.estatisticas.naoEncontrados}

⚠️ PROBLEMAS ENCONTRADOS:
- Produtos sem padrão: ${validacao.problemas.filter(p => p.tipo === 'produto_sem_padrao').length}
- Aliases duplicados: ${validacao.problemas.filter(p => p.tipo === 'alias_duplicado').length}
- Aliases genéricos: ${validacao.problemas.filter(p => p.tipo === 'alias_muito_generico').length}
- Inconsistências: ${validacao.problemas.filter(p => p.tipo === 'inconsistencia_variacao').length}

📝 RECOMENDAÇÕES PRIORITÁRIAS:
${validacao.recomendacoes.map(rec => `- ${rec}`).join('\n')}

🎯 PRÓXIMOS PASSOS:
1. Corrigir aliases duplicados
2. Adicionar variações "padrão" em falta
3. Criar produtos faltantes no banco de dados
4. Sincronizar sinônimos automaticamente
  `;
  
  console.log('✅ [Auditoria] Auditoria completa finalizada');
  
  return { validacao, verificacaoBanco, sugestoes, relatorio };
};