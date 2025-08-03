import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface FallbackStrategy {
  name: string;
  execute: (linha: string, nomeFornecedor: string) => Promise<ProdutoExtraido | null>;
  priority: number;
}

interface QualityMetrics {
  totalProdutos: number;
  produtosIdentificados: number;
  produtosComPreco: number;
  mediaConfianca: number;
  origemDistribuicao: Record<string, number>;
}

class FallbackSystemManager {
  private strategies: FallbackStrategy[] = [];
  private metricas: QualityMetrics = {
    totalProdutos: 0,
    produtosIdentificados: 0,
    produtosComPreco: 0,
    mediaConfianca: 0,
    origemDistribuicao: {}
  };

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies() {
    // Estratégia de matching por palavras-chave FLV
    this.strategies.push({
      name: 'keyword_matching',
      priority: 1,
      execute: async (linha: string, nomeFornecedor: string) => {
        const keywordsFLV = [
          'tomate', 'cebola', 'batata', 'cenoura', 'alface', 'couve', 'repolho',
          'abobrinha', 'berinjela', 'pimentão', 'pepino', 'abacate', 'limão',
          'laranja', 'maçã', 'banana', 'uva', 'manga', 'mamão', 'abacaxi',
          'melancia', 'melão', 'morango', 'pêra', 'pêssego', 'ameixa'
        ];

        const linhaNorm = linha.toLowerCase();
        const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
        const precos = linha.match(regexPreco);
        const preco = precos ? parseFloat(precos[precos.length - 1].replace(',', '.')) : null;

        for (const keyword of keywordsFLV) {
          if (linhaNorm.includes(keyword)) {
            // Extrai contexto ao redor da palavra-chave
            const palavras = linhaNorm.split(/\s+/);
            const indiceKeyword = palavras.findIndex(p => p.includes(keyword));
            
            let contexto = keyword;
            if (indiceKeyword > 0) contexto = palavras[indiceKeyword - 1] + ' ' + contexto;
            if (indiceKeyword < palavras.length - 1) contexto = contexto + ' ' + palavras[indiceKeyword + 1];

            return {
              produto: keyword.charAt(0).toUpperCase() + keyword.slice(1),
              tipo: contexto !== keyword ? contexto : '',
              preco,
              fornecedor: nomeFornecedor,
              linhaOriginal: linha,
              aliasUsado: keyword,
              origem: 'manual' as const,
              confianca: 0.4
            };
          }
        }

        return null;
      }
    });

    // Estratégia de padrões numéricos (produtos com código)
    this.strategies.push({
      name: 'numeric_pattern',
      priority: 2,
      execute: async (linha: string, nomeFornecedor: string) => {
        const regexCodigo = /([A-Z]{2,}\s*\d+|\d+[A-Z]+)/g;
        const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
        
        const codigos = linha.match(regexCodigo);
        const precos = linha.match(regexPreco);
        
        if (codigos && precos) {
          const preco = parseFloat(precos[precos.length - 1].replace(',', '.'));
          const codigo = codigos[0];
          
          return {
            produto: 'Produto codificado',
            tipo: `Código: ${codigo}`,
            preco,
            fornecedor: nomeFornecedor,
            linhaOriginal: linha,
            aliasUsado: codigo,
            origem: 'manual' as const,
            confianca: 0.3
          };
        }

        return null;
      }
    });

    // Estratégia de última instância - qualquer linha com preço
    this.strategies.push({
      name: 'price_only',
      priority: 3,
      execute: async (linha: string, nomeFornecedor: string) => {
        const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
        const precos = linha.match(regexPreco);
        
        if (precos) {
          const preco = parseFloat(precos[precos.length - 1].replace(',', '.'));
          let descricao = linha.replace(regexPreco, '').trim();
          
          // Limita a 50 caracteres
          if (descricao.length > 50) {
            descricao = descricao.substring(0, 50) + '...';
          }
          
          return {
            produto: 'Não identificado',
            tipo: descricao || linha.trim(),
            preco,
            fornecedor: nomeFornecedor,
            linhaOriginal: linha,
            aliasUsado: '',
            origem: 'manual' as const,
            confianca: 0.1
          };
        }

        return null;
      }
    });
  }

  // Executa estratégias de fallback em ordem de prioridade
  async executeFallback(linha: string, nomeFornecedor: string): Promise<ProdutoExtraido | null> {
    console.log(`Fallback: Tentando estratégias para "${linha.substring(0, 50)}..."`);
    
    const estrategiasOrdenadas = [...this.strategies].sort((a, b) => a.priority - b.priority);
    
    for (const estrategia of estrategiasOrdenadas) {
      try {
        const resultado = await estrategia.execute(linha, nomeFornecedor);
        if (resultado) {
          console.log(`Fallback: Sucesso com estratégia "${estrategia.name}"`);
          return resultado;
        }
      } catch (error) {
        console.error(`Fallback: Erro na estratégia "${estrategia.name}":`, error);
        continue;
      }
    }
    
    console.log('Fallback: Nenhuma estratégia funcionou');
    return null;
  }

  // Atualiza métricas de qualidade
  updateQualityMetrics(produtos: ProdutoExtraido[]): void {
    this.metricas.totalProdutos = produtos.length;
    this.metricas.produtosIdentificados = produtos.filter(p => p.origem !== 'manual').length;
    this.metricas.produtosComPreco = produtos.filter(p => p.preco !== null).length;
    
    if (produtos.length > 0) {
      const confiancas = produtos
        .filter(p => p.confianca !== undefined)
        .map(p => p.confianca!);
      
      this.metricas.mediaConfianca = confiancas.length > 0 
        ? confiancas.reduce((a, b) => a + b, 0) / confiancas.length 
        : 0;
    }

    // Distribuição por origem
    this.metricas.origemDistribuicao = {};
    produtos.forEach(p => {
      this.metricas.origemDistribuicao[p.origem] = 
        (this.metricas.origemDistribuicao[p.origem] || 0) + 1;
    });

    console.log('Métricas de qualidade atualizadas:', this.metricas);
  }

  // Obtém métricas de qualidade
  getQualityMetrics(): QualityMetrics {
    return { ...this.metricas };
  }

  // Verifica se o sistema precisa de ajustes
  shouldTriggerAlert(): boolean {
    if (this.metricas.totalProdutos === 0) return false;
    
    const taxaIdentificacao = this.metricas.produtosIdentificados / this.metricas.totalProdutos;
    const taxaPreco = this.metricas.produtosComPreco / this.metricas.totalProdutos;
    
    return taxaIdentificacao < 0.7 || taxaPreco < 0.8 || this.metricas.mediaConfianca < 0.6;
  }

  // Gera relatório de qualidade
  generateQualityReport(): string {
    const { totalProdutos, produtosIdentificados, produtosComPreco, mediaConfianca, origemDistribuicao } = this.metricas;
    
    if (totalProdutos === 0) return 'Nenhum produto processado ainda.';
    
    const taxaIdentificacao = Math.round((produtosIdentificados / totalProdutos) * 100);
    const taxaPreco = Math.round((produtosComPreco / totalProdutos) * 100);
    const confiancaMedia = Math.round(mediaConfianca * 100);
    
    let report = `📊 Relatório de Qualidade:\n`;
    report += `• ${totalProdutos} produtos processados\n`;
    report += `• ${taxaIdentificacao}% identificados automaticamente\n`;
    report += `• ${taxaPreco}% com preço identificado\n`;
    report += `• ${confiancaMedia}% confiança média\n\n`;
    
    report += `📈 Distribuição por origem:\n`;
    Object.entries(origemDistribuicao).forEach(([origem, count]) => {
      const porcentagem = Math.round((count / totalProdutos) * 100);
      report += `• ${origem}: ${count} (${porcentagem}%)\n`;
    });
    
    return report;
  }
}

// Instância global do sistema de fallback
export const fallbackSystem = new FallbackSystemManager();

// Função auxiliar para usar o sistema de fallback
export const aplicarFallback = async (linha: string, nomeFornecedor: string): Promise<ProdutoExtraido | null> => {
  return await fallbackSystem.executeFallback(linha, nomeFornecedor);
};

export { type QualityMetrics };