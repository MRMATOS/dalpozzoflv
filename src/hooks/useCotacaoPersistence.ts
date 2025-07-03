
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const isAuthenticated = !!user;
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
  const [cotacaoSalva, setCotacaoSalva] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState<RestauracaoData | null>(null);
  
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDataRef = useRef<string>('');

  // Auto-carregar última cotação ao inicializar
  useEffect(() => {
    const carregarUltimaCotacao = async () => {
      if (!isAuthenticated || !user?.id) return;

      console.log('=== CARREGANDO ÚLTIMA COTAÇÃO AUTOMATICAMENTE ===');
      setIsLoadingCotacao(true);

      try {
        const { data, error } = await supabase
          .from('cotacoes')
          .select('*')
          .eq('user_id', user.id)
          .is('enviado_em', null) // Buscar apenas rascunhos não enviados
          .order('data', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Erro ao carregar cotação:', error);
          setDadosCarregados(null);
        } else if (data) {
          console.log('Cotação encontrada para carregar:', data);
          setCotacaoId(data.id);
          setCotacaoRestaurada(new Date(data.data));
          setCotacaoSalva(true); // Marcar como salva para habilitar auto-save
          
          const dadosRestaurados = {
            produtosExtraidos: (data.produtos_extraidos as unknown as ProdutoExtraido[]) || [],
            tabelaComparativa: (data.tabela_comparativa as unknown as ItemTabelaComparativa[]) || [],
          };
          
          setDadosCarregados(dadosRestaurados);
          console.log('Dados carregados automaticamente:', dadosRestaurados);
        } else {
          console.log('Nenhuma cotação encontrada - iniciando limpa');
          setDadosCarregados(null);
        }
      } catch (error) {
        console.error('Erro ao carregar cotação:', error);
        setDadosCarregados(null);
      } finally {
        setIsLoadingCotacao(false);
        completSync();
      }
    };

    if (isAuthenticated) {
      carregarUltimaCotacao();
    }
  }, [isAuthenticated, user?.id, completSync]);

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
          }, RETRY_DELAY * tentativa);
        });
      }
      
      return false;
    }
  }, [cotacaoId, secureUpdate, secureInsert]);

  // Salvamento manual de rascunho
  const salvarRascunho = useCallback(async (dadosCotacao: CotacaoData) => {
    if (!isAuthenticated || !user?.id || !dadosCotacao.produtosExtraidos.length) {
      toast.error('Adicione produtos antes de salvar');
      return false;
    }

    console.log('=== SALVANDO RASCUNHO MANUALMENTE ===');
    console.log('Dados para salvar:', dadosCotacao);

    startSync();

    try {
      const sucesso = await tentarSalvarComRetry(dadosCotacao);
      
      if (sucesso) {
        setCotacaoSalva(true);
        completSync();
        toast.success('Rascunho salvo com sucesso!');
        return true;
      } else {
        failSync('Falha ao salvar rascunho');
        toast.error('Erro ao salvar rascunho. Tente novamente.');
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      failSync('Erro inesperado ao salvar');
      toast.error('Erro inesperado ao salvar rascunho');
      return false;
    }
  }, [user?.id, isAuthenticated, startSync, completSync, failSync, tentarSalvarComRetry]);

  // Auto-save somente após primeira salvamento manual
  const salvarCotacao = useCallback(async (dadosCotacao: CotacaoData) => {
    if (!cotacaoSalva) {
      console.log('Auto-save desabilitado até primeiro salvamento manual');
      return;
    }

    if (!isAuthenticated || !user?.id || !dadosCotacao.produtosExtraidos.length) return;

    // Verificar se os dados realmente mudaram
    const dadosString = JSON.stringify({
      produtosExtraidos: dadosCotacao.produtosExtraidos,
      tabelaComparativa: dadosCotacao.tabelaComparativa
    });
    
    if (dadosString === lastSaveDataRef.current) {
      console.log('Dados não mudaram, pulando auto-save');
      return;
    }

    lastSaveDataRef.current = dadosString;
    markUnsavedChanges();

    console.log('=== AUTO-SAVE ATIVADO ===');

    startSync();

    try {
      const sucesso = await tentarSalvarComRetry(dadosCotacao);
      
      if (sucesso) {
        completSync();
        console.log('Auto-save concluído com sucesso');
      } else {
        failSync('Falha no auto-save');
      }
    } catch (error) {
      console.error('Erro no auto-save:', error);
      failSync('Erro no auto-save');
    }
  }, [user?.id, isAuthenticated, startSync, completSync, failSync, markUnsavedChanges, tentarSalvarComRetry, cotacaoSalva]);

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

  // Restaurar último rascunho (não enviado)
  const restaurarUltimaCotacao = useCallback(async (): Promise<RestauracaoData | null> => {
    if (!isAuthenticated || !user?.id) return null;

    console.log('=== RESTAURANDO ÚLTIMO RASCUNHO ===');

    try {
      const { data, error } = await supabase
        .from('cotacoes')
        .select('*')
        .eq('user_id', user.id)
        .is('enviado_em', null) // Buscar apenas rascunhos não enviados
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao restaurar cotação:', error);
        toast.error('Erro ao restaurar cotação');
        return null;
      }

      if (data) {
        console.log('Rascunho encontrado para restaurar:', data);
        setCotacaoId(data.id);
        setCotacaoRestaurada(new Date(data.data));
        setCotacaoSalva(true); // Marcar como salva para habilitar auto-save
        
        toast.success(`Rascunho restaurado do dia ${new Date(data.data).toLocaleDateString('pt-BR')}`);
        
        return {
          produtosExtraidos: (data.produtos_extraidos as unknown as ProdutoExtraido[]) || [],
          tabelaComparativa: (data.tabela_comparativa as unknown as ItemTabelaComparativa[]) || [],
        };
      }

      toast.info('Nenhum rascunho encontrado');
      return null;
    } catch (error) {
      console.error('Erro ao restaurar cotação:', error);
      toast.error('Erro ao restaurar cotação');
      return null;
    }
  }, [user?.id, isAuthenticated]);

  // Nova cotação - finalizar atual e criar nova
  const novaCotacao = useCallback(async () => {
    console.log('=== FINALIZANDO COTAÇÃO ATUAL E CRIANDO NOVA ===');
    
    // Finalizar cotação atual se existir
    if (cotacaoId) {
      try {
        const { error } = await secureUpdate('cotacoes', cotacaoId, { 
          enviado_em: new Date().toISOString() 
        });
        if (error) {
          console.error('Erro ao finalizar cotação atual:', error);
        } else {
          console.log('Cotação atual finalizada');
        }
      } catch (error) {
        console.error('Erro ao finalizar cotação atual:', error);
      }
    }
    
    // Limpar dados locais para nova cotação
    setCotacaoId(null);
    setCotacaoRestaurada(null);
    setCotacaoSalva(false); // Desabilitar auto-save até próximo salvamento manual
    lastSaveDataRef.current = '';
    setDadosCarregados(null);
    
    const dadosLimpos = {
      produtosExtraidos: [] as ProdutoExtraido[],
      tabelaComparativa: [] as ItemTabelaComparativa[],
    };
    
    completSync();
    toast.success('Nova cotação iniciada');
    
    return dadosLimpos;
  }, [cotacaoId, secureUpdate, completSync]);

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
    toast.info('Tentando sincronizar novamente...');
  }, []);

  return {
    salvarCotacao,
    salvarRascunho,
    restaurarUltimaCotacao,
    novaCotacao,
    marcarComoEnviada,
    retrySync,
    cotacaoRestaurada,
    isLoadingCotacao,
    dadosCarregados, // Dados carregados automaticamente
    syncStatus,
    formatLastSyncTime,
    novaCotacaoIniciada: false
  };
};
