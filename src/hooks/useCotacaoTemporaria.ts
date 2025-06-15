import { useState, useEffect, useCallback } from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useSecureOperations } from '@/hooks/useSecureOperations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProdutoExtraido, ItemTabelaComparativa } from '@/utils/productExtraction/types';

interface CotacaoData {
  produtosExtraidos: ProdutoExtraido[];
  tabelaComparativa: ItemTabelaComparativa[];
  fornecedoresProcessados: Set<string>;
}

export const useCotacaoTemporaria = () => {
  const { user, isAuthenticated } = useSecureAuth();
  const { secureInsert, secureUpdate } = useSecureOperations();
  const [cotacaoId, setCotacaoId] = useState<string | null>(null);
  const [cotacaoRestaurada, setCotacaoRestaurada] = useState<Date | null>(null);
  const [salvandoAutomaticamente, setSalvandoAutomaticamente] = useState(false);
  const [isLoadingCotacao, setIsLoadingCotacao] = useState(true);
  const [dadosCarregados, setDadosCarregados] = useState<CotacaoData | null>(null);

  // Carregar cotação em rascunho ao inicializar
  useEffect(() => {
    const carregarCotacaoRascunho = async () => {
      if (!isAuthenticated || !user?.id) {
        setIsLoadingCotacao(false);
        return;
      }

      console.log('=== CARREGANDO COTAÇÃO EM RASCUNHO ===');
      console.log('User ID:', user.id);

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
          setIsLoadingCotacao(false);
          return;
        }

        if (data) {
          console.log('Cotação encontrada:', data);
          setCotacaoId(data.id);
          
          const dadosRestaurados = {
            produtosExtraidos: (data.produtos_extraidos as unknown as ProdutoExtraido[]) || [],
            tabelaComparativa: (data.tabela_comparativa as unknown as ItemTabelaComparativa[]) || [],
            fornecedoresProcessados: new Set<string>()
          };
          
          setDadosCarregados(dadosRestaurados);
          console.log('Dados carregados automaticamente:', dadosRestaurados);
          
          if (dadosRestaurados.produtosExtraidos.length > 0) {
            toast.success('Cotação em andamento restaurada automaticamente');
          }
        } else {
          console.log('Nenhuma cotação em rascunho encontrada');
          setDadosCarregados({
            produtosExtraidos: [],
            tabelaComparativa: [],
            fornecedoresProcessados: new Set<string>()
          });
        }
      } catch (error) {
        console.error('Erro ao buscar cotação:', error);
        setDadosCarregados({
          produtosExtraidos: [],
          tabelaComparativa: [],
          fornecedoresProcessados: new Set<string>()
        });
      } finally {
        setIsLoadingCotacao(false);
      }
    };

    carregarCotacaoRascunho();
  }, [user?.id, isAuthenticated]);

  // Salvar cotação automaticamente
  const salvarCotacao = useCallback(async (dadosCotacao: CotacaoData) => {
    if (!isAuthenticated || !user?.id || !dadosCotacao.produtosExtraidos.length || salvandoAutomaticamente) return;

    console.log('=== SALVANDO COTAÇÃO ===');
    console.log('User ID:', user.id);

    setSalvandoAutomaticamente(true);

    try {
      const dadosParaSalvar = {
        produtos_extraidos: JSON.parse(JSON.stringify(dadosCotacao.produtosExtraidos)),
        tabela_comparativa: JSON.parse(JSON.stringify(dadosCotacao.tabelaComparativa)),
        data: new Date().toISOString()
      };

      console.log('Dados preparados para salvar:', dadosParaSalvar);

      if (cotacaoId) {
        console.log('Atualizando cotação existente, ID:', cotacaoId);
        const { error } = await secureUpdate('cotacoes', cotacaoId, dadosParaSalvar);
        
        if (error) {
          console.error('Erro ao atualizar cotação:', error);
          throw new Error(error);
        }
        console.log('Cotação atualizada com sucesso');
      } else {
        console.log('Criando nova cotação');
        const { data, error } = await secureInsert('cotacoes', dadosParaSalvar);
        
        if (error) {
          console.error('Erro ao criar cotação:', error);
          throw new Error(error);
        }
        console.log('Nova cotação criada, ID:', data.id);
        setCotacaoId(data.id);
      }
    } catch (error) {
      console.error('Erro geral ao salvar cotação:', error);
    } finally {
      setSalvandoAutomaticamente(false);
    }
  }, [user?.id, cotacaoId, salvandoAutomaticamente, secureInsert, secureUpdate, isAuthenticated]);

  // Restaurar última cotação enviada
  const restaurarUltimaCotacao = useCallback(async (): Promise<CotacaoData | null> => {
    if (!isAuthenticated || !user?.id) return null;

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
  }, [user?.id, isAuthenticated]);

  // Criar nova cotação (limpar dados)
  const novaCotacao = useCallback(() => {
    setCotacaoId(null);
    setCotacaoRestaurada(null);
    const dadosLimpos = {
      produtosExtraidos: [] as ProdutoExtraido[],
      tabelaComparativa: [] as ItemTabelaComparativa[],
      fornecedoresProcessados: new Set<string>()
    };
    setDadosCarregados(dadosLimpos);
    return dadosLimpos;
  }, []);

  // Marcar cotação como enviada
  const marcarComoEnviada = useCallback(async (): Promise<string | null> => {
    console.log('=== MARCANDO COTAÇÃO COMO ENVIADA ===');
    console.log('Cotação ID:', cotacaoId);

    if (!cotacaoId || !isAuthenticated || !user?.id) {
      console.log('Dados insuficientes para marcar como enviada');
      return null;
    }

    try {
      const { error } = await secureUpdate('cotacoes', cotacaoId, { 
        enviado_em: new Date().toISOString() 
      });

      if (error) {
        console.error('Erro ao marcar cotação como enviada:', error);
        throw new Error(error);
      }

      console.log('Cotação marcada como enviada com sucesso');
      return cotacaoId;
    } catch (error) {
      console.error('Erro ao marcar cotação como enviada:', error);
      return null;
    }
  }, [cotacaoId, user?.id, secureUpdate, isAuthenticated]);

  return {
    salvarCotacao,
    restaurarUltimaCotacao,
    novaCotacao,
    marcarComoEnviada,
    cotacaoRestaurada,
    salvandoAutomaticamente,
    isLoadingCotacao,
    dadosCarregados
  };
};
