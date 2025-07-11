import { supabase } from '@/integrations/supabase/client';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

export interface RegistroAprendizado {
  id?: string;
  fornecedor: string;
  texto_original: string;
  produto_extraido: string;
  tipo_extraido: string;
  preco_extraido: number | null;
  produto_corrigido?: string;
  tipo_corrigido?: string;
  preco_corrigido?: number | null;
  feedback_qualidade?: number; // 1-5
  aprovado?: boolean | null;
  aplicado?: boolean;
}

export interface PadraoFornecedor {
  id?: string;
  fornecedor: string;
  padrao_texto: string;
  produto_identificado: string;
  tipo_identificado: string;
  confianca: number;
  ocorrencias: number;
  ativo: boolean;
}

export interface SugestaoInteligente {
  id?: string;
  tipo_sugestao: 'produto' | 'preco' | 'padrao';
  contexto: any;
  sugestao: string;
  confianca: number;
  aceita?: boolean | null;
}

export class AprendizadoService {
  
  // Registrar feedback do usuário sobre a extração
  static async registrarFeedback(
    produto: ProdutoExtraido,
    textoOriginal: string,
    feedback: {
      produto_corrigido?: string;
      tipo_corrigido?: string;
      preco_corrigido?: number | null;
      qualidade: number; // 1-5
      aprovado: boolean;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sistema_aprendizado')
        .insert({
          fornecedor: produto.fornecedor,
          texto_original: textoOriginal,
          produto_extraido: produto.produto,
          tipo_extraido: produto.tipo,
          preco_extraido: produto.preco,
          produto_corrigido: feedback.produto_corrigido,
          tipo_corrigido: feedback.tipo_corrigido,
          preco_corrigido: feedback.preco_corrigido,
          feedback_qualidade: feedback.qualidade,
          aprovado: feedback.aprovado
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao registrar feedback:', error);
      return false;
    }
  }

  // Buscar padrões conhecidos para um fornecedor
  static async buscarPadroesFornecedor(fornecedor: string): Promise<PadraoFornecedor[]> {
    try {
      const { data, error } = await supabase
        .from('padroes_fornecedores')
        .select('*')
        .eq('fornecedor', fornecedor)
        .eq('ativo', true)
        .order('confianca', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar padrões:', error);
      return [];
    }
  }

  // Aplicar aprendizado aos produtos extraídos
  static async aplicarAprendizado(
    produtos: ProdutoExtraido[], 
    fornecedor: string
  ): Promise<ProdutoExtraido[]> {
    try {
      const padroes = await this.buscarPadroesFornecedor(fornecedor);
      
      return produtos.map(produto => {
        // Buscar padrão correspondente
        const padraoEncontrado = padroes.find(padrao => 
          this.textosSimilares(produto.linhaOriginal, padrao.padrao_texto) ||
          this.textosSimilares(produto.produto, padrao.produto_identificado)
        );

        if (padraoEncontrado && padraoEncontrado.confianca > 0.7) {
          return {
            ...produto,
            produto: padraoEncontrado.produto_identificado,
            tipo: padraoEncontrado.tipo_identificado,
            confianca: Math.min((produto.confianca || 0) + padraoEncontrado.confianca * 0.3, 1.0),
            origem: 'banco' as const
          };
        }

        return produto;
      });
    } catch (error) {
      console.error('Erro ao aplicar aprendizado:', error);
      return produtos;
    }
  }

  // Gerar sugestões inteligentes baseadas no histórico
  static async gerarSugestoes(
    textoMensagem: string,
    fornecedor: string
  ): Promise<SugestaoInteligente[]> {
    try {
      const sugestoes: SugestaoInteligente[] = [];

      // Buscar histórico de aprendizado para o fornecedor
      const { data: historico, error } = await supabase
        .from('sistema_aprendizado')
        .select('*')
        .eq('fornecedor', fornecedor)
        .eq('aprovado', true)
        .order('criado_em', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Analisar padrões comuns
      const padroesComuns = this.analisarPadroesTexto(historico || []);
      
      for (const padrao of padroesComuns) {
        if (textoMensagem.toLowerCase().includes(padrao.indicador.toLowerCase())) {
          sugestoes.push({
            tipo_sugestao: 'produto',
            contexto: { fornecedor, texto_trecho: padrao.indicador },
            sugestao: `Possível produto: ${padrao.produto} (${padrao.tipo})`,
            confianca: padrao.confianca
          });
        }
      }

      return sugestoes;
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [];
    }
  }

  // Marcar sugestão como aceita ou rejeitada
  static async avaliarSugestao(sugestaoId: string, aceita: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sugestoes_inteligentes')
        .update({ aceita })
        .eq('id', sugestaoId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao avaliar sugestão:', error);
      return false;
    }
  }

  // Obter estatísticas de aprendizado
  static async obterEstatisticas(): Promise<{
    total_registros: number;
    feedback_positivo: number;
    feedback_negativo: number;
    padroes_identificados: number;
    fornecedores_treinados: number;
  }> {
    try {
      const [registros, padroes] = await Promise.all([
        supabase
          .from('sistema_aprendizado')
          .select('aprovado'),
        supabase
          .from('padroes_fornecedores')
          .select('fornecedor')
          .eq('ativo', true)
      ]);

      const stats = {
        total_registros: registros.data?.length || 0,
        feedback_positivo: registros.data?.filter(r => r.aprovado === true).length || 0,
        feedback_negativo: registros.data?.filter(r => r.aprovado === false).length || 0,
        padroes_identificados: padroes.data?.length || 0,
        fornecedores_treinados: [...new Set(padroes.data?.map(p => p.fornecedor))].length || 0
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return {
        total_registros: 0,
        feedback_positivo: 0,
        feedback_negativo: 0,
        padroes_identificados: 0,
        fornecedores_treinados: 0
      };
    }
  }

  // Métodos utilitários privados
  private static textosSimilares(texto1: string, texto2: string): boolean {
    const clean1 = texto1.toLowerCase().trim();
    const clean2 = texto2.toLowerCase().trim();
    
    // Similarity simples - pode ser melhorado
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    
    const words1 = clean1.split(/\s+/);
    const words2 = clean2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length >= Math.min(words1.length, words2.length) * 0.6;
  }

  private static analisarPadroesTexto(registros: any[]): Array<{
    indicador: string;
    produto: string;
    tipo: string;
    confianca: number;
  }> {
    const padroes: Map<string, any> = new Map();

    registros.forEach(registro => {
      const produto = registro.produto_corrigido || registro.produto_extraido;
      const tipo = registro.tipo_corrigido || registro.tipo_extraido;
      
      // Extrair palavras-chave do texto original
      const palavrasChave = registro.texto_original
        .toLowerCase()
        .match(/\b\w{3,}\b/g) || [];

      palavrasChave.forEach(palavra => {
        const chave = `${palavra}-${produto}-${tipo}`;
        if (padroes.has(chave)) {
          padroes.get(chave).ocorrencias++;
          padroes.get(chave).confianca = Math.min(padroes.get(chave).confianca + 0.1, 1.0);
        } else {
          padroes.set(chave, {
            indicador: palavra,
            produto,
            tipo,
            ocorrencias: 1,
            confianca: registro.feedback_qualidade >= 4 ? 0.8 : 0.6
          });
        }
      });
    });

    return Array.from(padroes.values())
      .filter(p => p.ocorrencias >= 2 && p.confianca >= 0.7)
      .sort((a, b) => b.confianca - a.confianca);
  }
}