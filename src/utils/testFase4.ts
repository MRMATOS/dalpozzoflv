/**
 * Testes da Fase 4 - Verificação de correção do "Padrão" artificial
 * 
 * Este arquivo contém testes baseados nas mensagens reais dos fornecedores
 * encontradas na documentação para verificar se o sistema agora funciona
 * corretamente sem inserir artificialmente a palavra "Padrão".
 */

import { extrairProdutosAvancado } from '@/services/cotacao/advancedExtractionService';

interface TesteResultado {
  mensagem: string;
  esperado: { produto: string; tipo: string };
  resultado: { produto: string; tipo: string } | null;
  sucesso: boolean;
  observacao: string;
}

// Casos de teste baseados na documentação
const CASOS_TESTE = [
  {
    mensagem: "Acelga padrão 4,00 unidade",
    esperado: { produto: "Acelga", tipo: "" },
    descricao: "Acelga sem variação específica deve associar ao produto pai"
  },
  {
    mensagem: "Abobrinha padrão 5,10",
    esperado: { produto: "Abobrinha", tipo: "" },
    descricao: "Abobrinha sem variação específica deve associar ao produto pai"
  },
  {
    mensagem: "Banana katurra 2.00",
    esperado: { produto: "Banana", tipo: "Katurra" },
    descricao: "Banana com variação específica deve manter a variação"
  },
  {
    mensagem: "Manga tommy padrão 7,50 Rio sul",
    esperado: { produto: "Manga", tipo: "Tommy" },
    descricao: "Manga tommy deve identificar tommy como variação"
  },
  {
    mensagem: "Pepino japonês Klaina padrão 5,20",
    esperado: { produto: "Pepino", tipo: "Japonês" },
    descricao: "Pepino japonês deve identificar japonês como variação"
  },
  {
    mensagem: "Batata doce roxa padrão 1.70",
    esperado: { produto: "Batata Doce", tipo: "Roxa" },
    descricao: "Batata doce roxa deve identificar roxa como variação"
  },
  {
    mensagem: "Beterraba 1.70 padrão top",
    esperado: { produto: "Beterraba", tipo: "" },
    descricao: "Beterraba sem variação específica deve associar ao produto pai"
  }
];

export const executarTesteFase4 = async (): Promise<TesteResultado[]> => {
  console.log('🧪 Iniciando Testes da Fase 4 - Eliminação do Padrão Artificial');
  
  const resultados: TesteResultado[] = [];
  
  for (const caso of CASOS_TESTE) {
    try {
      console.log(`\n📝 Testando: "${caso.mensagem}"`);
      
      const produtosExtraidos = await extrairProdutosAvancado(caso.mensagem, 'TesteAutomatizado');
      
      let resultado: TesteResultado;
      
      if (produtosExtraidos.length === 0) {
        resultado = {
          mensagem: caso.mensagem,
          esperado: caso.esperado,
          resultado: null,
          sucesso: false,
          observacao: "Nenhum produto foi extraído"
        };
      } else {
        const produtoExtraido = produtosExtraidos[0];
        const resultadoExtracao = {
          produto: produtoExtraido.produto,
          tipo: produtoExtraido.tipo
        };
        
        const produtoCorreto = resultadoExtracao.produto.toLowerCase().includes(caso.esperado.produto.toLowerCase());
        const tipoCorreto = caso.esperado.tipo === "" 
          ? (resultadoExtracao.tipo === "" || resultadoExtracao.tipo.toLowerCase() === "padrão")
          : resultadoExtracao.tipo.toLowerCase().includes(caso.esperado.tipo.toLowerCase());
        
        const sucesso = produtoCorreto && (caso.esperado.tipo === "" ? resultadoExtracao.tipo === "" : tipoCorreto);
        
        resultado = {
          mensagem: caso.mensagem,
          esperado: caso.esperado,
          resultado: resultadoExtracao,
          sucesso,
          observacao: sucesso 
            ? "✅ Funcionou conforme esperado" 
            : `❌ Esperado: ${caso.esperado.produto} ${caso.esperado.tipo || '(sem tipo)'}, Obtido: ${resultadoExtracao.produto} ${resultadoExtracao.tipo || '(sem tipo)'}`
        };
      }
      
      resultados.push(resultado);
      console.log(`${resultado.sucesso ? '✅' : '❌'} ${resultado.observacao}`);
      
    } catch (error) {
      console.error(`❌ Erro no teste "${caso.mensagem}":`, error);
      resultados.push({
        mensagem: caso.mensagem,
        esperado: caso.esperado,
        resultado: null,
        sucesso: false,
        observacao: `Erro durante extração: ${error}`
      });
    }
  }
  
  // Relatório final
  const sucessos = resultados.filter(r => r.sucesso).length;
  const total = resultados.length;
  
  console.log(`\n📊 RELATÓRIO FASE 4:`);
  console.log(`✅ Sucessos: ${sucessos}/${total} (${((sucessos/total)*100).toFixed(1)}%)`);
  console.log(`❌ Falhas: ${total - sucessos}/${total}`);
  
  if (sucessos === total) {
    console.log('🎉 FASE 4 CONCLUÍDA COM SUCESSO! Padrão artificial eliminado completamente.');
  } else {
    console.log('⚠️ FASE 4 PARCIALMENTE IMPLEMENTADA. Algumas correções ainda são necessárias.');
  }
  
  return resultados;
};

export const gerarRelatorioFase4 = (resultados: TesteResultado[]): string => {
  let relatorio = "# Relatório dos Testes da Fase 4\n\n";
  relatorio += "## Objetivo\nVerificar se o sistema parou de inserir artificialmente 'Padrão' como variação.\n\n";
  relatorio += "## Casos Testados\n\n";
  
  resultados.forEach((resultado, index) => {
    relatorio += `### Teste ${index + 1}: ${resultado.mensagem}\n`;
    relatorio += `**Esperado:** ${resultado.esperado.produto} ${resultado.esperado.tipo || '(sem tipo)'}\n`;
    relatorio += `**Resultado:** ${resultado.resultado ? `${resultado.resultado.produto} ${resultado.resultado.tipo || '(sem tipo)'}` : 'Nenhum produto extraído'}\n`;
    relatorio += `**Status:** ${resultado.sucesso ? '✅ SUCESSO' : '❌ FALHA'}\n`;
    relatorio += `**Observação:** ${resultado.observacao}\n\n`;
  });
  
  const sucessos = resultados.filter(r => r.sucesso).length;
  const total = resultados.length;
  
  relatorio += `## Resumo Final\n`;
  relatorio += `- **Total de testes:** ${total}\n`;
  relatorio += `- **Sucessos:** ${sucessos}\n`;
  relatorio += `- **Falhas:** ${total - sucessos}\n`;
  relatorio += `- **Taxa de sucesso:** ${((sucessos/total)*100).toFixed(1)}%\n\n`;
  
  if (sucessos === total) {
    relatorio += "🎉 **FASE 4 CONCLUÍDA COM SUCESSO!** O sistema agora funciona corretamente sem inserir 'Padrão' artificialmente.\n";
  } else {
    relatorio += "⚠️ **ATENÇÃO:** Algumas correções ainda são necessárias para eliminar completamente o 'Padrão' artificial.\n";
  }
  
  return relatorio;
};