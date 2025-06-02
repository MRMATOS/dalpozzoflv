
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
}

export const useLojas = () => {
  const [lojas, setLojas] = useState<Loja[]>([]);

  useEffect(() => {
    const fetchLojas = async () => {
      try {
        const { data, error } = await supabase
          .from('lojas')
          .select('id, nome, ativo')
          .eq('ativo', true)
          .order('nome');

        if (error) {
          console.error('Erro ao buscar lojas:', error);
          return;
        }

        setLojas(data || []);
      } catch (error) {
        console.error('Erro ao buscar lojas:', error);
      }
    };

    fetchLojas();
  }, []);

  return { lojas };
};
