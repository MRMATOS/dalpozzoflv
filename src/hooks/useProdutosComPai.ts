
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

      // Organizar produtos pai seguidos de suas variações
      const produtosPai = data?.filter(p => !p.produto_pai_id) || [];
      const produtosFilhos = data?.filter(p => p.produto_pai_id) || [];
      
      const produtosOrganizados: any[] = [];
      
      // Para cada produto pai, adicionar ele e suas variações
      produtosPai.forEach(pai => {
        // Adicionar produto pai
        produtosOrganizados.push({
          ...pai,
          display_name: pai.produto || `ID: ${pai.id?.substring(0, 8)}`
        });
        
        // Adicionar variações deste pai
        const variacoesDoPai = produtosFilhos
          .filter(filho => filho.produto_pai_id === pai.id)
          .sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0));
        
        variacoesDoPai.forEach(variacao => {
          produtosOrganizados.push({
            ...variacao,
            display_name: `${pai.produto} ${variacao.nome_variacao}`
          });
        });
      });
      
      // Adicionar produtos órfãos (sem pai definido corretamente)
      const produtosOrfaos = produtosFilhos.filter(filho => 
        !produtosPai.some(pai => pai.id === filho.produto_pai_id)
      );
      
      produtosOrfaos.forEach(orfao => {
        produtosOrganizados.push({
          ...orfao,
          display_name: orfao.produto || orfao.nome_variacao || `ID: ${orfao.id?.substring(0, 8)}`
        });
      });

      setProdutos(produtosOrganizados);
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
