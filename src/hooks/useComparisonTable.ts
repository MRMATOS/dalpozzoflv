
import { useState, useEffect, useCallback } from 'react';
import { ItemTabelaComparativa, ProdutoExtraido } from '@/utils/productExtraction/types';

interface UseComparisonTableProps {
  produtosExtraidos: ProdutoExtraido[];
  produtosDB: any[];
}

export const useComparisonTable = ({ produtosExtraidos, produtosDB }: UseComparisonTableProps) => {
  const [tabelaComparativa, setTabelaComparativa] = useState<ItemTabelaComparativa[]>([]);

  const obterUnidadePadraoProduto = useCallback((produto: string, tipo: string): string => {
    const produtoExato = produtosDB.find(p => 
      p.produto?.toLowerCase().includes(produto.toLowerCase()) &&
      (p.nome_variacao?.toLowerCase() === tipo.toLowerCase() || 
       p.nome_base?.toLowerCase() === tipo.toLowerCase())
    );
    if (produtoExato && produtoExato.unidade) return produtoExato.unidade;

    const produtoBase = produtosDB.find(p => 
      p.produto?.toLowerCase().includes(produto.toLowerCase()) ||
      p.nome_base?.toLowerCase().includes(produto.toLowerCase())
    );
    if (produtoBase && produtoBase.unidade) return produtoBase.unidade;
    
    return 'Caixa';
  }, [produtosDB]);

  const criarTabelaComparativa = useCallback((produtos: ProdutoExtraido[]) => {
    const fornecedoresList = [...new Set(produtos.map(p => p.fornecedor))];
    const produtosAgrupados: { [chave: string]: ItemTabelaComparativa } = {};

    produtos.forEach(produto => {
      const chave = `${produto.produto}_${produto.tipo}`;
      if (!produtosAgrupados[chave]) {
        const unidadePadrao = obterUnidadePadraoProduto(produto.produto, produto.tipo);
        produtosAgrupados[chave] = {
          produto: produto.produto,
          tipo: produto.tipo,
          fornecedores: {},
          quantidades: {},
          unidadePedido: {}
        };
        fornecedoresList.forEach(f => {
          produtosAgrupados[chave].fornecedores[f] = null;
          produtosAgrupados[chave].quantidades[f] = 0;
          produtosAgrupados[chave].unidadePedido[f] = unidadePadrao;
        });
      }
      produtosAgrupados[chave].fornecedores[produto.fornecedor] = produto.preco;
    });

    const tabela = Object.values(produtosAgrupados).sort((a, b) => 
      a.produto.localeCompare(b.produto) || a.tipo.localeCompare(b.tipo)
    );
    setTabelaComparativa(tabela);
  }, [obterUnidadePadraoProduto]);

  useEffect(() => {
    if (produtosExtraidos) {
      criarTabelaComparativa(produtosExtraidos);
    }
  }, [produtosExtraidos, criarTabelaComparativa]);

  const atualizarQuantidade = (produtoIndex: number, fornecedor: string, quantidade: string) => {
    const novaTabela = [...tabelaComparativa];
    if (novaTabela[produtoIndex]) {
        novaTabela[produtoIndex].quantidades[fornecedor] = parseInt(quantidade) || 0;
        setTabelaComparativa(novaTabela);
    }
  };

  const atualizarUnidadePedido = (produtoIndex: number, fornecedor: string, unidade: string) => {
    const novaTabela = [...tabelaComparativa];
    if (novaTabela[produtoIndex]) {
        novaTabela[produtoIndex].unidadePedido[fornecedor] = unidade;
        setTabelaComparativa(novaTabela);
    }
  };

  return {
    tabelaComparativa,
    setTabelaComparativa,
    atualizarQuantidade,
    atualizarUnidadePedido,
  };
};

