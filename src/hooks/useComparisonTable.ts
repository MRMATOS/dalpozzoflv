
import { useState, useEffect, useCallback, useRef } from 'react';
import { ItemTabelaComparativa, ProdutoExtraido } from '@/utils/productExtraction/types';

interface UseComparisonTableProps {
  produtosExtraidos: ProdutoExtraido[];
  produtosDB: any[];
}

export const useComparisonTable = ({ produtosExtraidos, produtosDB }: UseComparisonTableProps) => {
  const [tabelaComparativa, setTabelaComparativa] = useState<ItemTabelaComparativa[]>([]);
  const tabelaRef = useRef<ItemTabelaComparativa[]>([]);
  
  // manter a referência sempre atualizada sem recriar callbacks
  useEffect(() => {
    tabelaRef.current = tabelaComparativa;
  }, [tabelaComparativa]);

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

  const criarTabelaComparativa = useCallback((produtos: ProdutoExtraido[]) => {
    const fornecedoresList = [...new Set(produtos.map(p => p.fornecedor))];
    const produtosAgrupados: { [chave: string]: ItemTabelaComparativa } = {};

    produtos.forEach(produto => {
      // Verificação defensiva para dados válidos - NUNCA permitir null
      const produtoNome = produto.produto && produto.produto.trim() !== '' ? produto.produto : 'Produto não identificado';
      // FILTRO FINAL: Converter 'padrão' para string vazia (produto pai)
      let produtoTipo = produto.tipo && produto.tipo.trim() !== '' ? produto.tipo : '';
      if (produtoTipo === 'padrão') {
        produtoTipo = '';
      }
      
      const chave = `${produtoNome}_${produtoTipo}`;
      if (!produtosAgrupados[chave]) {
        const unidadePadrao = obterUnidadePadraoProduto(produtoNome, produtoTipo);
        
        // Buscar dados existentes na tabela atual para preservar quantidades e unidades
        const itemExistente = tabelaRef.current.find(item => 
          item.produto === produtoNome && item.tipo === produtoTipo
        );
        
        produtosAgrupados[chave] = {
          produto: produtoNome,
          tipo: produtoTipo,
          fornecedores: {},
          quantidades: {},
          unidadePedido: {},
          descricaoOriginal: {} // Inicializar descrições originais
        };
        
        fornecedoresList.forEach(f => {
          // Preservar preços existentes
          produtosAgrupados[chave].fornecedores[f] = (itemExistente?.fornecedores?.[f] ?? null);
          // Preservar quantidades existentes ou inicializar com 0
          produtosAgrupados[chave].quantidades[f] = itemExistente?.quantidades?.[f] ?? 0;
          // Preservar unidades existentes ou usar padrão
          produtosAgrupados[chave].unidadePedido[f] = itemExistente?.unidadePedido?.[f] ?? unidadePadrao;
          // Preservar descrições existentes ou inicializar vazio
          produtosAgrupados[chave].descricaoOriginal![f] = itemExistente?.descricaoOriginal?.[f] ?? '';
        });
      }
      
      // Definir preço e capturar descrição original, SEM sobrescrever manualmente editados
      const precoAtual = produtosAgrupados[chave].fornecedores[produto.fornecedor];
      if (precoAtual === null || typeof precoAtual === 'undefined') {
        produtosAgrupados[chave].fornecedores[produto.fornecedor] = produto.preco;
      }
      if (produtosAgrupados[chave].descricaoOriginal) {
        produtosAgrupados[chave].descricaoOriginal[produto.fornecedor] = extrairDescricaoOriginal(produto.linhaOriginal);
      }
    });

    const tabela = Object.values(produtosAgrupados).sort((a, b) => 
      a.produto.localeCompare(b.produto) || a.tipo.localeCompare(b.tipo)
    );
    setTabelaComparativa(tabela);
  }, [obterUnidadePadraoProduto, extrairDescricaoOriginal]);

  useEffect(() => {
    if (produtosExtraidos) {
      criarTabelaComparativa(produtosExtraidos);
    }
  }, [produtosExtraidos]);

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
        const normalizado = preco.replace(',', '.');
        const novoPreco = parseFloat(normalizado);
        novaTabela[produtoIndex].fornecedores[fornecedor] = isNaN(novoPreco) ? 0 : novoPreco;
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
