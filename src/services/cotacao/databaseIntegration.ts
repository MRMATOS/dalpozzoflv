import { supabase } from '@/integrations/supabase/client';
import { intelligentProductSearch } from '@/utils/productExtraction/advancedSearch';
import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface ProdutoEncontrado {
  id: string;
  nome: string;
  produtoPaiId?: string;
  produtoPaiNome?: string;
  confidence: number;
}

// Busca produto no banco de dados usando busca inteligente
export async function buscarProdutoNoBanco(
  termoBusca: string
): Promise<ProdutoEncontrado | null> {
  try {
    // Primeiro tenta busca inteligente no dicionário
    const resultadoInteligente = intelligentProductSearch(termoBusca, dicionarioProdutos);
    
    if (resultadoInteligente) {
      // Busca o produto no banco usando o resultado da busca inteligente
      const { data: produtos, error } = await supabase
        .from('produtos')
        .select(`
          id,
          produto,
          produto_pai_id
        `)
        .or(`produto.ilike.%${resultadoInteligente.produto}%,nome_variacao.ilike.%${resultadoInteligente.tipo}%`)
        .eq('ativo', true)
        .limit(5);

      if (error) {
        console.error('Erro ao buscar produto no banco:', error);
        return null;
      }

      if (produtos && produtos.length > 0) {
        const produto = produtos[0];
        return {
          id: produto.id,
          nome: produto.produto,
          produtoPaiId: produto.produto_pai_id,
          produtoPaiNome: undefined,
          confidence: resultadoInteligente.confidence
        };
      }
    }

    // Se não encontrou com busca inteligente, tenta busca direta no banco
    const { data: produtosDireto, error: erroDireto } = await supabase
      .from('produtos')
      .select(`
        id,
        produto,
        produto_pai_id
      `)
      .ilike('produto', `%${termoBusca}%`)
      .eq('ativo', true)
      .limit(3);

    if (erroDireto) {
      console.error('Erro na busca direta:', erroDireto);
      return null;
    }

    if (produtosDireto && produtosDireto.length > 0) {
      const produto = produtosDireto[0];
      return {
        id: produto.id,
        nome: produto.produto,
        produtoPaiId: produto.produto_pai_id,
        produtoPaiNome: undefined,
        confidence: 60 // Confiança menor para busca direta
      };
    }

    return null;
  } catch (error) {
    console.error('Erro na busca de produto:', error);
    return null;
  }
}

// Enriquece produtos extraídos com dados do banco
export async function enriquecerProdutosExtraidos(
  produtos: ProdutoExtraido[]
): Promise<ProdutoExtraido[]> {
  const produtosEnriquecidos = [];

  for (const produto of produtos) {
    const produtoEncontrado = await buscarProdutoNoBanco(produto.produto);
    
    const produtoEnriquecido: ProdutoExtraido = {
      ...produto,
      produtoId: produtoEncontrado?.id,
      variacaoId: produtoEncontrado?.produtoPaiId,
      confianca: (produtoEncontrado?.confidence || 0) / 100,
      origem: produtoEncontrado ? 'banco' : produto.origem
    };

    produtosEnriquecidos.push(produtoEnriquecido);
  }

  return produtosEnriquecidos;
}

// Salva mapeamento de aprendizado para melhorar futuras extrações
export async function salvarAprendizadoExtração(
  termoOriginal: string,
  produtoCorretoId: string,
  fornecedor: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('aprendizado_extracao')
      .insert({
        termo_original: termoOriginal,
        produto_correto_id: produtoCorretoId,
        fornecedor,
        confidence: 100
      });

    if (error) {
      console.error('Erro ao salvar aprendizado:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro no sistema de aprendizado:', error);
    return false;
  }
}

// Recupera aprendizados anteriores
export async function recuperarAprendizados(
  fornecedor?: string
): Promise<Record<string, string>> {
  try {
    let query = supabase
      .from('aprendizado_extracao')
      .select('termo_original, produto_correto_id');

    if (fornecedor) {
      query = query.eq('fornecedor', fornecedor);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao recuperar aprendizados:', error);
      return {};
    }

    const mapeamentos: Record<string, string> = {};
    data?.forEach(item => {
      mapeamentos[item.termo_original.toLowerCase()] = item.produto_correto_id;
    });

    return mapeamentos;
  } catch (error) {
    console.error('Erro na recuperação de aprendizados:', error);
    return {};
  }
}