
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProdutoComPai {
  id: string;
  produto: string | null;
  nome_variacao: string | null;
  produto_pai_id: string | null;
  unidade: string | null;
  ativo: boolean | null;
  media_por_caixa: number | null;
  ordem_exibicao: number | null;
  nome_base: string | null;
  observacoes: string | null;
  created_at: string | null;
  produto_pai_id_ref: string | null;
  produto_pai_nome: string | null;
  display_name?: string;
}

export const useProdutosComPai = () => {
  const [produtos, setProdutos] = useState<ProdutoComPai[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('produtos_com_pai')
        .select('*')
        .eq('ativo', true)
        .order('ordem_exibicao', { ascending: true })
        .order('produto', { ascending: true });

      if (error) throw error;

      // Processar os produtos para criar o display_name correto
      const produtosProcessados = data?.map(produto => {
        let displayName = '';
        
        if (produto.produto_pai_nome && produto.nome_variacao) {
          // É uma variação: "Produto Pai Variação"
          displayName = `${produto.produto_pai_nome} ${produto.nome_variacao}`;
        } else if (produto.produto) {
          // É um produto principal
          displayName = produto.produto;
        } else if (produto.nome_variacao) {
          // Caso especial: apenas variação sem pai (não deveria acontecer)
          displayName = produto.nome_variacao;
        } else {
          // Fallback
          displayName = `ID: ${produto.id.substring(0, 8)}`;
        }

        return {
          ...produto,
          display_name: displayName
        };
      }) || [];

      setProdutos(produtosProcessados);
    } catch (error: any) {
      console.error('Erro ao buscar produtos:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();

    // Configurar listener para atualizações em tempo real
    const channel = supabase
      .channel('produtos-pai-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos'
        },
        () => {
          console.log('Mudança detectada na tabela produtos, recarregando...');
          fetchProdutos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    produtos, 
    loading, 
    error, 
    recarregar: fetchProdutos 
  };
};
