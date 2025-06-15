
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useSecureOperations } from '@/hooks/useSecureOperations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ProdutoExtraido, ItemTabelaComparativa } from '@/utils/productExtraction/types';
import { useSyncStatus } from '@/hooks/useSyncStatus';

interface CotacaoData {
  produtosExtraidos: ProdutoExtraido[];
  tabelaComparativa: ItemTabelaComparativa[];
  fornecedoresProcessados?: Set<string>;
}

type RestauracaoData = Omit<CotacaoData, 'fornecedoresProcessados'>;

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 segundos

export const useCotacaoPersistence = () => {
  const { user, isAuthenticated } = useSecureAuth();
  const { secureInsert, secureUpdate } = useSecureOperations();
  const { 
    syncStatus, 
    startSync, 
    completSync, 
    failSync, 
    markUnsavedChanges,
    formatLastSyncTime 
  } = useSyncStatus();
  
  const [cotacaoId, setCotacaoId] = useState<string | null>(null);
  const [cotacaoRestaurada, setCotacaoRestaurada] = useState<Date | null>(null);
  const [isLoadingCotacao, setIsLoadingCotacao] = useState(true);
  const [dadosCarregados, setDadosCarregados] = useState<CotacaoData | null>(null);
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDataRef = useRef<string>('');

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
          };
          
          setDadosCarregados(dadosRestaurados);
          console.log('Dados carregados automaticamente:', dadosRestaurados);
          
          if (dadosRestaurados.produtosExtraidos.length > 0) {
            toast.success('Cotação em andamento restaurada automaticamente');
          }
          
          // Marcar como sincronizado
          completSync();
        } else {
          console.log('Nenhuma cotação em rascunho encontrada');
          setDadosCarregados({
            produtosExtraidos: [],
            tabelaComparativa: [],
          });
        }
      } catch (error) {
        console.error('Erro ao buscar cotação:', error);
        setDadosCarregados({
          produtosExtraidos: [],
          tabelaComparativa: [],
        });
        failSync('Erro ao carregar cotação');
      } finally {
        setIsLoadingCotacao(false);
      }
    };

    carregarCotacaoRascunho();
  }, [user?.id, isAuthenticated, completSync, failSync]);

  // Implementar retry automático
  const tentarSalvarComRetry = useCallback(async (
    dadosCotacao: CotacaoData, 
    tentativa: number = 1
  ): Promise<boolean> => {
    try {
      const { fornecedoresProcessados, ...dadosParaSalvar } = dadosCotacao;
      const dadosParaSalvarJSON = {
        produtos_extraidos: dadosParaSalvar.produtosExtraidos,
        tabela_comparativa: dadosParaSalvar.tabelaComparativa,
        data: new Date().toISOString()
      };

      console.log(`Tentativa ${tentativa} de salvamento:`, dadosParaSalvarJSON);

      if (cotacaoId) {
        const { error } = await secureUpdate('cotacoes', cotacaoId, dadosParaSalvarJSON);
        if (error) throw new Error(error);
        console.log('Cotação atualizada com sucesso');
      } else {
        const { data, error } = await secureInsert('cotacoes', dadosParaSalvarJSON);
        if (error) throw new Error(error);
        if (data) {
          console.log('Nova cotação criada, ID:', data.id);
          setCotacaoId(data.id);
        }
      }

      return true;
    } catch (error) {
      console.error(`Erro na tentativa ${tentativa}:`, error);
      
      if (tentativa < MAX_RETRY_ATTEMPTS) {
        console.log(`Reagendando tentativa ${tentativa + 1} em ${RETRY_DELAY}ms`);
        
        return new Promise((resolve) => {
          retryTimeoutRef.current = setTimeout(async () => {
            const sucesso = await tentarSalvarComRetry(dadosCotacao, tentativa + 1);
            resolve(sucesso);
          }, RETRY_DELAY * tentativa); // Backoff exponencial
        });
      }
      
      return false;
    }
  }, [cotacaoId, secureUpdate, secureInsert]);

  // Salvar cotação com debounce e retry
  const salvarCotacao = useCallback(async (dadosCotacao: CotacaoData) => {
    if (!isAuthenticated || !user?.id || !dadosCotacao.produtosExtraidos.length) return;

    // Verificar se os dados realmente mudaram
    const dadosString = JSON.stringify({
      produtosExtraidos: dadosCotacao.produtosExtraidos,
      tabelaComparativa: dadosCotacao.tabelaComparativa
    });
    
    if (dadosString === lastSaveDataRef.current) {
      console.log('Dados não mudaram, pulando salvamento');
      return;
    }

    lastSaveDataRef.current = dadosString;
    markUnsavedChanges();

    console.log('=== INICIANDO SALVAMENTO COM RETRY ===');
    console.log('User ID:', user.id);

    startSync();

    try {
      const sucesso = await tentarSalvarComRetry(dadosCotacao);
      
      if (sucesso) {
        completSync();
        console.log('Cotação salva com sucesso');
      } else {
        failSync('Falha ao salvar após múltiplas tentativas');
        toast.error('Erro ao salvar cotação. Verifique sua conexão.');
      }
    } catch (error) {
      console.error('Erro geral ao salvar cotação:', error);
      failSync('Erro inesperado ao salvar');
    }
  }, [user?.id, isAuthenticated, startSync, completSync, failSync, markUnsavedChanges, tentarSalvarComRetry]);

  // Limpar timeout ao desmontar
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Implementar salvamento antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (syncStatus.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [syncStatus.hasUnsavedChanges]);

  // Restaurar última cotação enviada
  const restaurarUltimaCotacao = useCallback(async (): Promise<RestauracaoData | null> => {
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
    };
    setDadosCarregados(dadosLimpos);
    lastSaveDataRef.current = '';
    completSync();
    return dadosLimpos;
  }, [completSync]);

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
      completSync();
      return cotacaoId;
    } catch (error) {
      console.error('Erro ao marcar cotação como enviada:', error);
      failSync('Erro ao marcar como enviada');
      return null;
    }
  }, [cotacaoId, user?.id, secureUpdate, isAuthenticated, completSync, failSync]);

  // Retry manual
  const retrySync = useCallback(() => {
    if (dadosCarregados) {
      salvarCotacao(dadosCarregados);
    }
  }, [dadosCarregados, salvarCotacao]);

  return {
    salvarCotacao,
    restaurarUltimaCotacao,
    novaCotacao,
    marcarComoEnviada,
    retrySync,
    cotacaoRestaurada,
    isLoadingCotacao,
    dadosCarregados,
    syncStatus,
    formatLastSyncTime
  };
};
