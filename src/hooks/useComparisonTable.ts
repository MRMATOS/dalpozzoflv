
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

  // Função auxiliar para extrair descrição original limpa (sem preço)
  const extrairDescricaoOriginal = useCallback((linhaOriginal: string): string => {
    // Remove preços da linha
    const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
    let descricao = linhaOriginal.replace(regexPreco, '').trim();
    
    // Remove caracteres de separação comuns
    descricao = descricao.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();
    descricao = descricao.replace(/\s+/g, ' ');
    
    return descricao;
  }, []);

  // Função para validar se produto tem propriedades obrigatórias
  const isValidProduct = useCallback((produto: any): produto is ProdutoExtraido => {
    return produto && 
           typeof produto === 'object' &&
           typeof produto.produto === 'string' && 
           produto.produto.trim() !== '' &&
           typeof produto.fornecedor === 'string' && 
           produto.fornecedor.trim() !== '' &&
           typeof produto.tipo === 'string' &&
           typeof produto.preco === 'number' &&
           produto.preco > 0;
  }, []);

  const criarTabelaComparativa = useCallback((produtos: ProdutoExtraido[], tabelaAtual: ItemTabelaComparativa[]) => {
    // Filtrar produtos válidos com verificação rigorosa
    const produtosValidos = produtos.filter(isValidProduct);
    console.log('Criando tabela comparativa com produtos válidos:', produtosValidos.length, 'de', produtos.length);
    
    if (produtosValidos.length === 0) {
      return [];
    }
    
    const fornecedoresList = [...new Set(produtosValidos.map(p => p.fornecedor))];
    const produtosAgrupados: { [chave: string]: ItemTabelaComparativa } = {};

    produtosValidos.forEach(produto => {
      const chave = `${produto.produto}_${produto.tipo}`;
      if (!produtosAgrupados[chave]) {
        const unidadePadrao = obterUnidadePadraoProduto(produto.produto, produto.tipo);
        
        // Buscar dados existentes na tabela atual para preservar quantidades e unidades
        const itemExistente = tabelaAtual.find(item => 
          item && item.produto === produto.produto && item.tipo === produto.tipo
        );
        
        produtosAgrupados[chave] = {
          produto: produto.produto,
          tipo: produto.tipo,
          fornecedores: {},
          quantidades: {},
          unidadePedido: {},
          descricaoOriginal: {} // Inicializar descrições originais
        };
        
        fornecedoresList.forEach(f => {
          produtosAgrupados[chave].fornecedores[f] = null;
          // Preservar quantidades existentes ou inicializar com 0
          produtosAgrupados[chave].quantidades[f] = itemExistente?.quantidades?.[f] || 0;
          // Preservar unidades existentes ou usar padrão
          produtosAgrupados[chave].unidadePedido[f] = itemExistente?.unidadePedido?.[f] || unidadePadrao;
          // Preservar descrições existentes ou inicializar vazio
          produtosAgrupados[chave].descricaoOriginal![f] = itemExistente?.descricaoOriginal?.[f] || '';
        });
      }
      
      // Definir preço e capturar descrição original
      produtosAgrupados[chave].fornecedores[produto.fornecedor] = produto.preco;
      if (produtosAgrupados[chave].descricaoOriginal) {
        produtosAgrupados[chave].descricaoOriginal[produto.fornecedor] = extrairDescricaoOriginal(produto.linhaOriginal);
      }
    });

    return Object.values(produtosAgrupados).sort((a, b) => 
      a.produto.localeCompare(b.produto) || a.tipo.localeCompare(b.tipo)
    );
  }, [obterUnidadePadraoProduto, extrairDescricaoOriginal, isValidProduct]);

  useEffect(() => {
    console.log('useComparisonTable: produtos recebidos:', produtosExtraidos?.length || 0);
    
    if (!Array.isArray(produtosExtraidos)) {
      console.warn('useComparisonTable: produtos não é um array:', produtosExtraidos);
      setTabelaComparativa([]);
      return;
    }

    const novaTabela = criarTabelaComparativa(produtosExtraidos, tabelaComparativa);
    
    // Só atualizar se houve mudança real
    const tabelaAtualString = JSON.stringify(tabelaComparativa);
    const novaTabelaString = JSON.stringify(novaTabela);
    
    if (tabelaAtualString !== novaTabelaString) {
      console.log('useComparisonTable: atualizando tabela');
      setTabelaComparativa(novaTabela);
    }
  }, [produtosExtraidos]); // Remover criarTabelaComparativa das dependências

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

  const atualizarPreco = (produtoIndex: number, fornecedor: string, preco: string) => {
    const novaTabela = [...tabelaComparativa];
    if (novaTabela[produtoIndex]) {
        const novoPreco = parseFloat(preco) || 0;
        novaTabela[produtoIndex].fornecedores[fornecedor] = novoPreco;
        setTabelaComparativa(novaTabela);
    }
  };

  return {
    tabelaComparativa,
    setTabelaComparativa,
    atualizarQuantidade,
    atualizarUnidadePedido,
    atualizarPreco,
  };
};
