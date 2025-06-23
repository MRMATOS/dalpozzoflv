
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RequisicaoItem {
  produto_id: string;
  produto_nome: string;
  quantidade: number; // quantidade em caixas
  quantidade_calculada: number; // quantidade em quilos
  loja: string;
  unidade: string;
  media_por_caixa: number;
}

interface RequisicaoCompleta {
  id: string;
  loja: string;
  status: string;
  data_requisicao: string;
  itens: RequisicaoItem[];
  total_itens: number;
  total_caixas: number;
  total_quilos: number;
}

export const useRequisicoes = () => {
  const [requisicoes, setRequisicoes] = useState<RequisicaoItem[]>([]);
  const [requisicoesCompletas, setRequisicoesCompletas] = useState<RequisicaoCompleta[]>([]);
  const [lojasComRequisicoes, setLojasComRequisicoes] = useState<string[]>([]);

  const fetchRequisicoes = async () => {
    try {
      console.log('Buscando requisições...');
      
      const { data, error } = await supabase
        .from('itens_requisicao')
        .select(`
          produto_id,
          quantidade,
          quantidade_calculada,
          requisicao_id,
          requisicoes!inner(loja, status),
          produtos!inner(produto, unidade, media_por_caixa)
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
        quantidade: item.quantidade || 0, // caixas
        quantidade_calculada: item.quantidade_calculada || 0, // quilos
        loja: (item.requisicoes as any)?.loja || '',
        unidade: (item.produtos as any)?.unidade || '',
        media_por_caixa: (item.produtos as any)?.media_por_caixa || 20
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

  const fetchRequisicoesCompletas = async () => {
    try {
      console.log('Buscando requisições completas...');
      
      const { data, error } = await supabase
        .from('requisicoes')
        .select(`
          id,
          loja,
          status,
          data_requisicao,
          itens_requisicao(
            produto_id,
            quantidade,
            quantidade_calculada,
            produtos(produto, unidade, media_por_caixa)
          )
        `)
        .eq('status', 'pendente')
        .order('data_requisicao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar requisições completas:', error);
        return;
      }

      console.log('Requisições completas encontradas:', data);

      const requisicoesFormatadas = data?.map(req => {
        const itens = (req.itens_requisicao as any[]).map(item => ({
          produto_id: item.produto_id,
          produto_nome: item.produtos?.produto || '',
          quantidade: item.quantidade || 0,
          quantidade_calculada: item.quantidade_calculada || 0,
          loja: req.loja,
          unidade: item.produtos?.unidade || '',
          media_por_caixa: item.produtos?.media_por_caixa || 20
        }));

        return {
          id: req.id,
          loja: req.loja,
          status: req.status,
          data_requisicao: req.data_requisicao,
          itens,
          total_itens: itens.length,
          total_caixas: itens.reduce((sum, item) => sum + item.quantidade, 0),
          total_quilos: itens.reduce((sum, item) => sum + item.quantidade_calculada, 0)
        };
      }) || [];

      console.log('Requisições completas formatadas:', requisicoesFormatadas);
      setRequisicoesCompletas(requisicoesFormatadas);

    } catch (error) {
      console.error('Erro ao buscar requisições completas:', error);
    }
  };

  useEffect(() => {
    fetchRequisicoes();
    fetchRequisicoesCompletas();

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
          fetchRequisicoesCompletas();
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
          fetchRequisicoesCompletas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { 
    requisicoes, 
    requisicoesCompletas,
    lojasComRequisicoes,
    refetch: () => {
      fetchRequisicoes();
      fetchRequisicoesCompletas();
    }
  };
};
