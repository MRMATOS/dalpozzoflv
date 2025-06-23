
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StatusTransferencia } from '@/types/transferencias';

export const useTransferenciasStatus = () => {
  const queryClient = useQueryClient();

  const atualizarStatusMutation = useMutation({
    mutationFn: async ({ 
      transferenceId, 
      novoStatus, 
      observacoes 
    }: { 
      transferenceId: string; 
      novoStatus: StatusTransferencia; 
      observacoes?: string;
    }) => {
      const { error } = await supabase
        .from('transferencias')
        .update({ 
          status: novoStatus,
          ...(novoStatus === 'recebido' && { confirmado_em: new Date().toISOString() })
        })
        .eq('id', transferenceId);

      if (error) throw error;

      // Log adicional se houver observações
      if (observacoes) {
        await supabase
          .from('transferencias_logs')
          .insert({
            transferencia_id: transferenceId,
            status_anterior: novoStatus,
            status_novo: novoStatus,
            observacoes
          });
      }
    },
    onSuccess: (_, variables) => {
      toast.success(`Status atualizado para: ${variables.novoStatus}`);
      queryClient.invalidateQueries({ queryKey: ['transferencias'] });
      queryClient.invalidateQueries({ queryKey: ['transferencias-pendentes'] });
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const buscarStatusAtual = useQuery({
    queryKey: ['status-transferencias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias')
        .select(`
          id,
          status,
          loja_destino,
          quantidade_transferida,
          criado_em,
          produtos(produto)
        `)
        .in('status', ['separado', 'transferido'])
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const obterEstatisticas = useQuery({
    queryKey: ['estatisticas-transferencias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transferencias')
        .select('status')
        .gte('criado_em', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = data.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        pendentes: stats.pendente || 0,
        separados: stats.separado || 0,
        transferidos: stats.transferido || 0,
        recebidos: stats.recebido || 0,
        total: data.length
      };
    },
  });

  return {
    atualizarStatus: atualizarStatusMutation.mutate,
    isAtualizando: atualizarStatusMutation.isPending,
    statusAtual: buscarStatusAtual.data,
    isLoadingStatus: buscarStatusAtual.isLoading,
    estatisticas: obterEstatisticas.data,
    isLoadingEstatisticas: obterEstatisticas.isLoading
  };
};
