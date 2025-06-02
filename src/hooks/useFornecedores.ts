
import { useState, useEffect } from 'react';

interface Fornecedor {
  id: string;
  nome: string;
}

export const useFornecedores = () => {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  useEffect(() => {
    // Simulando fornecedores cadastrados - depois será integrado com Supabase
    const fornecedoresMock = [
      { id: '1', nome: 'Fornecedor 1' },
      { id: '2', nome: 'Fornecedor 2' },
      { id: '3', nome: 'Fornecedor 3' },
      { id: '4', nome: 'Fornecedor 4' },
    ];
    setFornecedores(fornecedoresMock);
  }, []);

  return { fornecedores };
};
