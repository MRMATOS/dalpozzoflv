
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RequisicaoItem {
  produto_id: string;
  produto_nome: string;
  quantidade_calculada: number;
  loja: string;
  unidade: string;
}

export const useRequisicoes = () => {
  const [requisicoes, setRequisicoes] = useState<RequisicaoItem[]>([]);
  const [lojasComRequisicoes, setLojasComRequisicoes] = useState<string[]>([]);

  useEffect(() => {
    const fetchRequisicoes = async () => {
      try {
        console.log('Buscando requisições...');
        
        const { data, error } = await supabase
          .from('itens_requisicao')
          .select(`
            produto_id,
            quantidade_calculada,
            requisicao_id,
            requisicoes!inner(loja, status),
            produtos!inner(produto, unidade)
          `)
          .eq('requisicoes.status', 'pendente');

        if (error) {
          console.error('Erro ao buscar requisições:', error);
          return;
        }

        console.log('Dados brutos das requisições:', data);

        const requisicoesFormatadas = data?.map(item => ({
          produto_id: item.produto_id,
          produto_nome: (item.produtos as any)?.produto || '',
          quantidade_calculada: item.quantidade_calculada || 0,
          loja: (item.requisicoes as any)?.loja || '',
          unidade: (item.produtos as any)?.unidade || ''
        })) || [];

        console.log('Requisições formatadas:', requisicoesFormatadas);

        setRequisicoes(requisicoesFormatadas);

        // Extrair lojas únicas que têm requisições
        const lojas = [...new Set(requisicoesFormatadas.map(item => item.loja).filter(loja => loja))];
        setLojasComRequisicoes(lojas);

      } catch (error) {
        console.error('Erro ao buscar requisições:', error);
      }
    };

    fetchRequisicoes();

    // Configurar listener para atualizações em tempo real
    const channel = supabase
      .channel('requisicoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requisicoes'
        },
        () => {
          console.log('Mudança detectada em requisições, recarregando...');
          fetchRequisicoes();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'itens_requisicao'
        },
        () => {
          console.log('Mudança detectada em itens_requisicao, recarregando...');
          fetchRequisicoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { requisicoes, lojasComRequisicoes };
};
