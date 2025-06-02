
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RequisicaoItem {
  produto_id: string;
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
        const { data, error } = await supabase
          .from('itens_requisicao')
          .select(`
            produto_id,
            quantidade_calculada,
            requisicao_id,
            requisicoes!inner(loja),
            produtos!inner(unidade)
          `)
          .eq('requisicoes.status', 'pendente');

        if (error) {
          console.error('Erro ao buscar requisições:', error);
          return;
        }

        console.log('Dados brutos das requisições:', data);

        const requisicoesFormatadas = data?.map(item => ({
          produto_id: item.produto_id,
          quantidade_calculada: item.quantidade_calculada || 0,
          loja: item.requisicoes?.loja || '',
          unidade: item.produtos?.unidade || ''
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
  }, []);

  return { requisicoes, lojasComRequisicoes };
};
