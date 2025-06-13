
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

const STORAGE_KEY = 'cotacao_temporaria';

export const useCotacaoTemporaria = () => {
  const { user } = useAuth();
  const [cotacao, setCotacao] = useState<CotacaoTemporaria>({ items: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do localStorage quando o usuário estiver disponível
  useEffect(() => {
    const carregarCotacao = () => {
      if (!user) {
        console.log('Usuário não carregado ainda, aguardando...');
        return;
      }

      try {
        const userStorageKey = `${STORAGE_KEY}_${user.id}`;
        const dados = localStorage.getItem(userStorageKey);
        
        if (dados) {
          const cotacaoSalva = JSON.parse(dados);
          console.log('Cotação carregada do localStorage:', cotacaoSalva);
          setCotacao(cotacaoSalva);
        } else {
          console.log('Nenhuma cotação encontrada no localStorage');
          setCotacao({ items: [] });
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
    if (user) {
      const userStorageKey = `${STORAGE_KEY}_${user.id}`;
      localStorage.removeItem(userStorageKey);
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

  return {
    cotacao,
    isLoading,
    adicionarItem,
    atualizarItem,
    removerItem,
    limparCotacao,
    definirRequisicao,
    obterItensSelecionados,
    obterTotalPorFornecedor
  };
};
