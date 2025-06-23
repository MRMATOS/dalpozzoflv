
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Transferencia {
  id: string;
  requisicao_id: string;
  produto_id: string;
  produto_nome: string;
  loja_origem: string;
  loja_destino: string;
  quantidade_requisitada: number;
  quantidade_transferida: number;
  status: string;
  criado_em: string;
  confirmado_em?: string;
  unidade: string;
  media_por_caixa: number;
}

export const useTransferencias = () => {
  const { user } = useAuth();
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransferencias = async () => {
    try {
      console.log('Buscando transferências...');
      
      const { data, error } = await supabase
        .from('transferencias')
        .select(`
          id,
          requisicao_id,
          produto_id,
          loja_origem,
          loja_destino,
          quantidade_requisitada,
          quantidade_transferida,
          status,
          criado_em,
          confirmado_em,
          produtos!inner(produto, unidade, media_por_caixa)
        `)
        .eq('status', 'pendente')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transferências:', error);
        return;
      }

      console.log('Dados das transferências:', data);

      const transferenciasFormatadas = data?.map(item => ({
        id: item.id,
        requisicao_id: item.requisicao_id,
        produto_id: item.produto_id,
        produto_nome: (item.produtos as any)?.produto || '',
        loja_origem: item.loja_origem,
        loja_destino: item.loja_destino,
        quantidade_requisitada: item.quantidade_requisitada || 0,
        quantidade_transferida: item.quantidade_transferida || 0,
        status: item.status,
        criado_em: item.criado_em,
        confirmado_em: item.confirmado_em,
        unidade: (item.produtos as any)?.unidade || '',
        media_por_caixa: (item.produtos as any)?.media_por_caixa || 20
      })) || [];

      console.log('Transferências formatadas:', transferenciasFormatadas);
      setTransferencias(transferenciasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar transferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarTransferencias = async (requisicaoId: string) => {
    try {
      console.log('Criando transferências para requisição:', requisicaoId);

      // Buscar a requisição e seus itens
      const { data: requisicao, error: reqError } = await supabase
        .from('requisicoes')
        .select(`
          id,
          loja,
          itens_requisicao(
            produto_id,
            quantidade,
            quantidade_calculada,
            produtos(produto, unidade, media_por_caixa)
          )
        `)
        .eq('id', requisicaoId)
        .single();

      if (reqError) {
        console.error('Erro ao buscar requisição:', reqError);
        throw reqError;
      }

      console.log('Requisição encontrada:', requisicao);

      // Criar transferências para cada item
      const transferenciasParaCriar = (requisicao.itens_requisicao as any[]).map(item => ({
        requisicao_id: requisicaoId,
        produto_id: item.produto_id,
        loja_origem: requisicao.loja,
        loja_destino: 'Centro de Distribuição',
        quantidade_requisitada: item.quantidade_calculada || 0,
        status: 'pendente',
        transferido_por: user?.id
      }));

      console.log('Transferências a criar:', transferenciasParaCriar);

      const { error: transferError } = await supabase
        .from('transferencias')
        .insert(transferenciasParaCriar);

      if (transferError) {
        console.error('Erro ao criar transferências:', transferError);
        throw transferError;
      }

      // Atualizar status da requisição para "enviado"
      const { error: updateError } = await supabase
        .from('requisicoes')
        .update({ status: 'enviado' })
        .eq('id', requisicaoId);

      if (updateError) {
        console.error('Erro ao atualizar status da requisição:', updateError);
        throw updateError;
      }

      console.log('Transferências criadas com sucesso!');
      await fetchTransferencias(); // Recarregar lista
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao criar transferências:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchTransferencias();

    // Configurar listener para atualizações em tempo real
    const channel = supabase
      .channel('transferencias-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transferencias'
        },
        () => {
          console.log('Mudança detectada em transferências, recarregando...');
          fetchTransferencias();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    transferencias,
    loading,
    criarTransferencias,
    refetch: fetchTransferencias
  };
};
