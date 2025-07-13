
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Fornecedor {
  id: string;
  nome: string;
  telefone?: string;
  status_tipo?: string;
}

export const useFornecedores = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    const fetchFornecedores = async () => {
      try {
        const { data, error } = await supabase
          .from('fornecedores')
          .select('id, nome, telefone, status_tipo')
          .order('nome');

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
  }, []);

  return { fornecedores };
};
