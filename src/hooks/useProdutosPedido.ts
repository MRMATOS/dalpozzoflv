import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProdutoPedido {
  id: string;
  produto: string;
  nome_variacao?: string;
  produto_pai_nome?: string;
  display_name: string;
}

export const useProdutosPedido = (pedidoId?: string, tipoPedido?: 'compra' | 'simples') => {
  const [produtos, setProdutos] = useState<ProdutoPedido[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProdutosPedido = async () => {
    if (!pedidoId || !tipoPedido) {
      setProdutos([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (tipoPedido === 'compra') {
        // Buscar produtos do pedido de compra via itens_pedido
        const { data: itens, error: itensError } = await supabase
          .from('itens_pedido')
          .select(`
            produto_id
          `)
          .eq('pedido_id', pedidoId);

        if (itensError) throw itensError;

        // Buscar detalhes dos produtos únicos
        const produtoIds = [...new Set(itens?.map(item => item.produto_id).filter(Boolean))];
        
        if (produtoIds.length > 0) {
          const { data: produtosData, error: produtosError } = await supabase
            .from('produtos_com_pai')
            .select('*')
            .in('id', produtoIds);

          if (produtosError) throw produtosError;

          const produtosFormatados = produtosData?.map(produto => ({
            id: produto.id!,
            produto: produto.produto || '',
            nome_variacao: produto.nome_variacao,
            produto_pai_nome: produto.produto_pai_nome,
            display_name: produto.nome_variacao 
              ? `${produto.produto_pai_nome || produto.produto} ${produto.nome_variacao}`
              : produto.produto || `ID: ${produto.id?.substring(0, 8)}`
          })) || [];

          setProdutos(produtosFormatados);
        } else {
          setProdutos([]);
        }

      } else if (tipoPedido === 'simples') {
        // Buscar produtos do pedido simples
        const { data: pedido, error: pedidoError } = await supabase
          .from('pedidos_simples')
          .select(`
            id,
            produto_id,
            produto_nome
          `)
          .eq('id', pedidoId);

        if (pedidoError) throw pedidoError;

        const produtosUnicos = new Map();
        
        // Buscar detalhes dos produtos que têm ID na tabela produtos
        const produtoIds = pedido?.map(item => item.produto_id).filter(Boolean) || [];
        let produtosComDetalhes: any[] = [];
        
        if (produtoIds.length > 0) {
          const { data: produtosData } = await supabase
            .from('produtos_com_pai')
            .select('*')
            .in('id', produtoIds);
          
          produtosComDetalhes = produtosData || [];
        }

        pedido?.forEach(item => {
          if (item.produto_id) {
            const produtoDetalhado = produtosComDetalhes.find(p => p.id === item.produto_id);
            if (produtoDetalhado) {
              produtosUnicos.set(produtoDetalhado.id, {
                id: produtoDetalhado.id,
                produto: produtoDetalhado.produto || '',
                nome_variacao: produtoDetalhado.nome_variacao,
                produto_pai_nome: produtoDetalhado.produto_pai_nome,
                display_name: produtoDetalhado.nome_variacao 
                  ? `${produtoDetalhado.produto_pai_nome || produtoDetalhado.produto} ${produtoDetalhado.nome_variacao}`
                  : produtoDetalhado.produto || item.produto_nome || `ID: ${produtoDetalhado.id.substring(0, 8)}`
              });
            } else {
              // Produto com ID mas sem detalhes encontrados
              produtosUnicos.set(item.produto_id, {
                id: item.produto_id,
                produto: item.produto_nome,
                display_name: item.produto_nome
              });
            }
          } else {
            // Produto sem referência na tabela produtos (apenas nome)
            produtosUnicos.set(item.id, {
              id: item.id,
              produto: item.produto_nome,
              display_name: item.produto_nome
            });
          }
        });

        setProdutos(Array.from(produtosUnicos.values()));
      }

    } catch (error: any) {
      console.error('Erro ao buscar produtos do pedido:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutosPedido();
  }, [pedidoId, tipoPedido]);

  return { 
    produtos, 
    loading, 
    error, 
    recarregar: fetchProdutosPedido 
  };
};