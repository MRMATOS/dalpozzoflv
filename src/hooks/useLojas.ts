
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
  is_cd?: boolean;
}

export const useLojas = () => {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [cdLoja, setCdLoja] = useState<Loja | null>(null);

  useEffect(() => {
    const fetchLojas = async () => {
      try {
        const { data, error } = await supabase
          .from('lojas')
          .select('id, nome, ativo, is_cd')
          .eq('ativo', true)
          .order('nome');

        if (error) {
          console.error('Erro ao buscar lojas:', error);
          return;
        }

        setLojas(data || []);
        
        // Encontrar a loja CD
        const cd = data?.find(loja => loja.is_cd);
        setCdLoja(cd || null);
      } catch (error) {
        console.error('Erro ao buscar lojas:', error);
      }
    };

    fetchLojas();
  }, []);

  return { lojas, cdLoja };
};
