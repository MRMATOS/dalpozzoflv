
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
  const [isLoadingCotacao, setIsLoadingCotacao] = useState(true);
  const [dadosCarregados, setDadosCarregados] = useState<CotacaoData | null>(null);

  // Carregar cotação em rascunho ao inicializar
  useEffect(() => {
    const carregarCotacaoRascunho = async () => {
      if (!user?.id) {
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
  }, [user?.id]);

  // Salvar cotação automaticamente
  const salvarCotacao = useCallback(async (dadosCotacao: CotacaoData) => {
    if (!user?.id || !dadosCotacao.produtosExtraidos.length || salvandoAutomaticamente) return;

    console.log('=== SALVANDO COTAÇÃO ===');
    console.log('User ID:', user.id);

    setSalvandoAutomaticamente(true);

    try {
      const dadosParaSalvar = {
        user_id: user.id,
        produtos_extraidos: JSON.parse(JSON.stringify(dadosCotacao.produtosExtraidos)),
        tabela_comparativa: JSON.parse(JSON.stringify(dadosCotacao.tabelaComparativa)),
        data: new Date().toISOString()
      };

      console.log('Dados preparados para salvar:', dadosParaSalvar);

      if (cotacaoId) {
        console.log('Atualizando cotação existente, ID:', cotacaoId);
        const { error } = await supabase
          .from('cotacoes')
          .update(dadosParaSalvar)
          .eq('id', cotacaoId);

        if (error) {
          console.error('Erro ao atualizar cotação:', error);
          throw error;
        }
        console.log('Cotação atualizada com sucesso');
      } else {
        console.log('Criando nova cotação');
        const { data, error } = await supabase
          .from('cotacoes')
          .insert(dadosParaSalvar)
          .select('id')
          .single();

        if (error) {
          console.error('Erro ao criar cotação:', error);
          throw error;
        }
        console.log('Nova cotação criada, ID:', data.id);
        setCotacaoId(data.id);
      }
    } catch (error) {
      console.error('Erro geral ao salvar cotação:', error);
    } finally {
      setSalvandoAutomaticamente(false);
    }
  }, [user?.id, cotacaoId, salvandoAutomaticamente]);

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

    if (!cotacaoId || !user?.id) {
      console.log('Dados insuficientes para marcar como enviada');
      return null;
    }

    try {
      const { error } = await supabase
        .from('cotacoes')
        .update({ enviado_em: new Date().toISOString() })
        .eq('id', cotacaoId);

      if (error) {
        console.error('Erro ao marcar cotação como enviada:', error);
        throw error;
      }

      console.log('Cotação marcada como enviada com sucesso');
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
    salvandoAutomaticamente,
    isLoadingCotacao,
    dadosCarregados
  };
};
