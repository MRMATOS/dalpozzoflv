
export interface ProdutoExtraido {
  produto: string;
  tipo: string;
  preco: number | null; // Preço opcional para permitir produtos sem preço
  fornecedor: string;
  linhaOriginal: string;
  aliasUsado: string;
  produtoId?: string; // ID do produto no banco quando identificado
  variacaoId?: string; // ID da variação específica quando encontrada
  confianca?: number; // Score de confiança na identificação (0-1)
  origem: 'dicionario' | 'sinonimo' | 'banco' | 'manual'; // Origem da identificação
  unidade?: string; // Unidade do produto (Caixa, Kg, etc.)
}

export interface ItemTabelaComparativa {
  produto: string;
  tipo: string;
  fornecedores: { [fornecedor: string]: number | null };
  quantidades: { [fornecedor: string]: number };
  unidadePedido: { [fornecedor: string]: string };
}
