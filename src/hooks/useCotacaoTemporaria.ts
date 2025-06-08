
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProdutoExtraido {
  produto: string;
  tipo: string;
  preco: number;
  fornecedor: string;
  linhaOriginal: string;
  aliasUsado: string;
}

interface ItemTabelaComparativa {
  produto: string;
  tipo: string;
  fornecedores: { [fornecedor: string]: number | null };
  quantidades: { [fornecedor: string]: number };
  unidadePedido: { [fornecedor: string]: string };
}

interface CotacaoData {
  produtosExtraidos: ProdutoExtraido[];
  tabelaComparativa: ItemTabelaComparativa[];
  fornecedoresProcessados: Set<string>;
}

export const useCotacaoTemporaria = () => {
  const { user } = useAuth();
  const [cotacaoId, setCotacaoId] = useState<string | null>(null);
  const [cotacaoRestaurada, setCotacaoRestaurada] = useState<Date | null>(null);
  const [salvandoAutomaticamente, setSalvandoAutomaticamente] = useState(false);

  // Carregar cotação em rascunho ao inicializar
  useEffect(() => {
    const carregarCotacaoRascunho = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('cotacoes')
          .select('*')
          .eq('user_id', user.id)
          .is('enviado_em', null)
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar cotação em rascunho:', error);
          return;
        }

        if (data) {
          setCotacaoId(data.id);
          return {
            produtosExtraidos: (data.produtos_extraidos as unknown as ProdutoExtraido[]) || [],
            tabelaComparativa: (data.tabela_comparativa as unknown as ItemTabelaComparativa[]) || [],
            fornecedoresProcessados: new Set<string>()
          };
        }
      } catch (error) {
        console.error('Erro ao buscar cotação:', error);
      }

      return null;
    };

    carregarCotacaoRascunho();
  }, [user?.id]);

  // Salvar cotação automaticamente
  const salvarCotacao = useCallback(async (dadosCotacao: CotacaoData) => {
    if (!user?.id || !dadosCotacao.produtosExtraidos.length) return;

    setSalvandoAutomaticamente(true);

    try {
      const dadosParaSalvar = {
        user_id: user.id,
        produtos_extraidos: JSON.parse(JSON.stringify(dadosCotacao.produtosExtraidos)),
        tabela_comparativa: JSON.parse(JSON.stringify(dadosCotacao.tabelaComparativa)),
        data: new Date().toISOString()
      };

      if (cotacaoId) {
        // Atualizar cotação existente
        const { error } = await supabase
          .from('cotacoes')
          .update(dadosParaSalvar)
          .eq('id', cotacaoId);

        if (error) throw error;
      } else {
        // Criar nova cotação
        const { data, error } = await supabase
          .from('cotacoes')
          .insert(dadosParaSalvar)
          .select('id')
          .single();

        if (error) throw error;
        setCotacaoId(data.id);
      }
    } catch (error) {
      console.error('Erro ao salvar cotação:', error);
    } finally {
      setSalvandoAutomaticamente(false);
    }
  }, [user?.id, cotacaoId]);

  // Restaurar última cotação enviada
  const restaurarUltimaCotacao = useCallback(async (): Promise<CotacaoData | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('cotacoes')
        .select('*')
        .eq('user_id', user.id)
        .not('enviado_em', 'is', null)
        .order('enviado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao restaurar cotação:', error);
        return null;
      }

      if (data) {
        setCotacaoRestaurada(new Date(data.enviado_em));
        toast.success(`Cotação restaurada do dia ${new Date(data.enviado_em).toLocaleDateString('pt-BR')}`);
        
        return {
          produtosExtraidos: (data.produtos_extraidos as unknown as ProdutoExtraido[]) || [],
          tabelaComparativa: (data.tabela_comparativa as unknown as ItemTabelaComparativa[]) || [],
          fornecedoresProcessados: new Set<string>()
        };
      }

      toast.info('Nenhuma cotação anterior encontrada');
      return null;
    } catch (error) {
      console.error('Erro ao restaurar cotação:', error);
      toast.error('Erro ao restaurar cotação');
      return null;
    }
  }, [user?.id]);

  // Criar nova cotação (limpar dados)
  const novaCotacao = useCallback(() => {
    setCotacaoId(null);
    setCotacaoRestaurada(null);
    return {
      produtosExtraidos: [] as ProdutoExtraido[],
      tabelaComparativa: [] as ItemTabelaComparativa[],
      fornecedoresProcessados: new Set<string>()
    };
  }, []);

  // Marcar cotação como enviada
  const marcarComoEnviada = useCallback(async (): Promise<string | null> => {
    if (!cotacaoId || !user?.id) return null;

    try {
      const { error } = await supabase
        .from('cotacoes')
        .update({ enviado_em: new Date().toISOString() })
        .eq('id', cotacaoId);

      if (error) throw error;

      return cotacaoId;
    } catch (error) {
      console.error('Erro ao marcar cotação como enviada:', error);
      return null;
    }
  }, [cotacaoId, user?.id]);

  return {
    salvarCotacao,
    restaurarUltimaCotacao,
    novaCotacao,
    marcarComoEnviada,
    cotacaoRestaurada,
    salvandoAutomaticamente
  };
};
