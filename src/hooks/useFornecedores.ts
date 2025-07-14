
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Fornecedor {
  id: string;
  nome: string;
  telefone?: string;
  status_tipo?: string;
}

type ContextoFornecedor = 'cotacao' | 'pedido_simples' | 'todos';

export const useFornecedores = (contexto: ContextoFornecedor = 'todos') => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        let query = supabase
          .from('fornecedores')
          .select('id, nome, telefone, status_tipo')
          .order('nome');

        // Aplicar filtro baseado no contexto
        if (contexto === 'cotacao') {
          query = query.in('status_tipo', ['Cotação', 'Cotação e Pedido']);
        } else if (contexto === 'pedido_simples') {
          query = query.in('status_tipo', ['Pedido Simples', 'Cotação e Pedido']);
        }
        // Se contexto === 'todos', não aplica filtro

        const { data, error } = await query;

        if (error) {
          console.error('Erro ao buscar fornecedores:', error);
          return;
        }

        setFornecedores(data || []);
      } catch (error) {
        console.error('Erro ao buscar fornecedores:', error);
      }
    };

    fetchFornecedores();
  }, [contexto]);

  return { fornecedores };
};
