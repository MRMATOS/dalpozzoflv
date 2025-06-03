
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EstoqueCotacao {
  id: string;
  produto_id: string;
  loja: string;
  quantidade: number;
  unidade: string;
  data_atualizacao: string;
  produto_nome?: string;
}

export const useEstoqueCotacao = () => {
  const [estoques, setEstoques] = useState<EstoqueCotacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    const fetchEstoques = async () => {
      try {
        setIsLoading(true);
        console.log('Buscando estoque de cotação...');
        
        const { data, error } = await supabase
          .from('estoque_cotacao')
          .select(`
            id,
            produto_id,
            loja,
            quantidade,
            unidade,
            data_atualizacao,
            produtos!inner(produto)
          `);

        if (error) {
          console.error('Erro ao buscar estoque de cotação:', error);
          return;
        }

        const estoquesFormatados = data?.map(item => ({
          id: item.id,
          produto_id: item.produto_id,
          loja: item.loja,
          quantidade: item.quantidade,
          unidade: item.unidade,
          data_atualizacao: item.data_atualizacao,
          produto_nome: (item.produtos as any)?.produto || ''
        })) || [];

        setEstoques(estoquesFormatados);
      } catch (error) {
        console.error('Erro ao buscar estoque de cotação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstoques();

    // Configurar listener para atualizações em tempo real
    const channel = supabase
      .channel('estoque-cotacao-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'estoque_cotacao'
        },
        () => {
          console.log('Mudança detectada no estoque de cotação, recarregando...');
          fetchEstoques();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const obterEstoqueProduto = (produtoId: string) => {
    return estoques.filter(estoque => estoque.produto_id === produtoId);
  };

  const atualizarEstoque = async (produtoId: string, loja: string, quantidade: number, unidade: string = 'Kg') => {
    try {
      const { error } = await supabase
        .from('estoque_cotacao')
        .upsert({
          produto_id: produtoId,
          loja: loja,
          quantidade: quantidade,
          unidade: unidade,
          data_atualizacao: new Date().toISOString()
        }, {
          onConflict: 'produto_id,loja'
        });

      if (error) {
        console.error('Erro ao atualizar estoque:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      return false;
    }
  };

  return { 
    estoques, 
    isLoading, 
    obterEstoqueProduto, 
    atualizarEstoque 
  };
};
