
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ItemCotacao {
  produto: string;
  tipo?: string;
  fornecedores: {
    [fornecedor: string]: {
      preco?: number;
      quantidade?: number;
      selecionado?: boolean;
    };
  };
}

export interface CotacaoTemporaria {
  items: ItemCotacao[];
  requisicaoId?: string;
}

// Interfaces para compatibilidade com a página Cotacao
export interface ProdutoExtraido {
  produto: string;
  tipo: string;
  preco: number;
  fornecedor: string;
  linhaOriginal: string;
  aliasUsado: string;
}

export interface ItemTabelaComparativa {
  produto: string;
  tipo: string;
  fornecedores: { [fornecedor: string]: number | null };
  quantidades: { [fornecedor: string]: number };
  unidadePedido: { [fornecedor: string]: string };
}

export interface DadosCarregados {
  produtosExtraidos: ProdutoExtraido[];
  tabelaComparativa: ItemTabelaComparativa[];
  fornecedoresProcessados: Set<string>;
}

const STORAGE_KEY = 'cotacao_temporaria';
const STORAGE_KEY_EXTENDED = 'cotacao_temporaria_extended';

export const useCotacaoTemporaria = () => {
  const { user } = useAuth();
  const [cotacao, setCotacao] = useState<CotacaoTemporaria>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [salvandoAutomaticamente, setSalvandoAutomaticamente] = useState(false);
  const [cotacaoRestaurada, setCotacaoRestaurada] = useState<Date | null>(null);
  const [dadosCarregados, setDadosCarregados] = useState<DadosCarregados | null>(null);

  // Carregar dados do localStorage quando o usuário estiver disponível
  useEffect(() => {
    const carregarCotacao = () => {
      if (!user) {
        console.log('Usuário não carregado ainda, aguardando...');
        return;
      }

      try {
        const userStorageKey = `${STORAGE_KEY}_${user.id}`;
        const userStorageKeyExtended = `${STORAGE_KEY_EXTENDED}_${user.id}`;
        
        const dados = localStorage.getItem(userStorageKey);
        const dadosExtended = localStorage.getItem(userStorageKeyExtended);
        
        if (dados) {
          const cotacaoSalva = JSON.parse(dados);
          console.log('Cotação carregada do localStorage:', cotacaoSalva);
          setCotacao(cotacaoSalva);
        } else {
          console.log('Nenhuma cotação encontrada no localStorage');
          setCotacao({ items: [] });
        }

        // Carregar dados estendidos se existirem
        if (dadosExtended) {
          const dadosExtendedParsed = JSON.parse(dadosExtended);
          // Converter fornecedoresProcessados de array para Set
          if (dadosExtendedParsed.fornecedoresProcessados) {
            dadosExtendedParsed.fornecedoresProcessados = new Set(dadosExtendedParsed.fornecedoresProcessados);
          }
          setDadosCarregados(dadosExtendedParsed);
          console.log('Dados estendidos carregados:', dadosExtendedParsed);
        }
      } catch (error) {
        console.error('Erro ao carregar cotação do localStorage:', error);
        setCotacao({ items: [] });
      } finally {
        setIsLoading(false);
      }
    };

    carregarCotacao();
  }, [user]);

  // Salvar no localStorage sempre que a cotação mudar
  useEffect(() => {
    if (!user || isLoading) return;

    try {
      const userStorageKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.setItem(userStorageKey, JSON.stringify(cotacao));
      console.log('Cotação salva no localStorage:', cotacao);
    } catch (error) {
      console.error('Erro ao salvar cotação no localStorage:', error);
    }
  }, [cotacao, user, isLoading]);

  const adicionarItem = (item: ItemCotacao) => {
    setCotacao(prev => ({
      ...prev,
      items: [...prev.items, item]
    }));
  };

  const atualizarItem = (index: number, item: ItemCotacao) => {
    setCotacao(prev => ({
      ...prev,
      items: prev.items.map((i, idx) => idx === index ? item : i)
    }));
  };

  const removerItem = (index: number) => {
    setCotacao(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const limparCotacao = () => {
    setCotacao({ items: [] });
    setDadosCarregados(null);
    setCotacaoRestaurada(null);
    
    if (user) {
      const userStorageKey = `${STORAGE_KEY}_${user.id}`;
      const userStorageKeyExtended = `${STORAGE_KEY_EXTENDED}_${user.id}`;
      localStorage.removeItem(userStorageKey);
      localStorage.removeItem(userStorageKeyExtended);
    }
  };

  const definirRequisicao = (requisicaoId: string) => {
    setCotacao(prev => ({
      ...prev,
      requisicaoId
    }));
  };

  const obterItensSelecionados = () => {
    return cotacao.items.filter(item => 
      Object.values(item.fornecedores).some(f => f.selecionado)
    );
  };

  const obterTotalPorFornecedor = () => {
    const totais: { [fornecedor: string]: number } = {};
    
    cotacao.items.forEach(item => {
      Object.entries(item.fornecedores).forEach(([fornecedor, dados]) => {
        if (dados.selecionado && dados.preco && dados.quantidade) {
          if (!totais[fornecedor]) {
            totais[fornecedor] = 0;
          }
          totais[fornecedor] += dados.preco * dados.quantidade;
        }
      });
    });
    
    return totais;
  };

  // Funções específicas para a página Cotacao
  const salvarCotacao = async (dados: DadosCarregados) => {
    if (!user) return;

    setSalvandoAutomaticamente(true);
    
    try {
      const userStorageKeyExtended = `${STORAGE_KEY_EXTENDED}_${user.id}`;
      
      // Converter Set para array para serialização
      const dadosParaSalvar = {
        ...dados,
        fornecedoresProcessados: Array.from(dados.fornecedoresProcessados)
      };
      
      localStorage.setItem(userStorageKeyExtended, JSON.stringify(dadosParaSalvar));
      console.log('Dados estendidos salvos:', dadosParaSalvar);
      
      // Simular delay de salvamento
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Erro ao salvar cotação estendida:', error);
    } finally {
      setSalvandoAutomaticamente(false);
    }
  };

  const restaurarUltimaCotacao = async (): Promise<DadosCarregados | null> => {
    if (!user) return null;

    try {
      const userStorageKeyExtended = `${STORAGE_KEY_EXTENDED}_${user.id}`;
      const dados = localStorage.getItem(userStorageKeyExtended);
      
      if (dados) {
        const dadosParsed = JSON.parse(dados);
        // Converter array para Set
        if (dadosParsed.fornecedoresProcessados) {
          dadosParsed.fornecedoresProcessados = new Set(dadosParsed.fornecedoresProcessados);
        }
        
        setDadosCarregados(dadosParsed);
        setCotacaoRestaurada(new Date());
        console.log('Cotação restaurada:', dadosParsed);
        
        return dadosParsed;
      }
    } catch (error) {
      console.error('Erro ao restaurar cotação:', error);
    }
    
    return null;
  };

  const novaCotacao = (): DadosCarregados => {
    const dadosLimpos: DadosCarregados = {
      produtosExtraidos: [],
      tabelaComparativa: [],
      fornecedoresProcessados: new Set<string>()
    };
    
    setDadosCarregados(dadosLimpos);
    setCotacaoRestaurada(null);
    limparCotacao();
    
    return dadosLimpos;
  };

  const marcarComoEnviada = async () => {
    // Implementação para marcar cotação como enviada
    console.log('Cotação marcada como enviada');
  };

  return {
    cotacao,
    isLoading,
    isLoadingCotacao: isLoading,
    salvandoAutomaticamente,
    cotacaoRestaurada,
    dadosCarregados,
    adicionarItem,
    atualizarItem,
    removerItem,
    limparCotacao,
    definirRequisicao,
    obterItensSelecionados,
    obterTotalPorFornecedor,
    salvarCotacao,
    restaurarUltimaCotacao,
    novaCotacao,
    marcarComoEnviada
  };
};
