
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Search, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '@/components/requisicoes/ProductCard';

interface Product {
  id: string;
  produto: string;
  unidade: string;
  escala_abastecimento?: Array<{
    escala1?: number;
    escala2?: number;
    escala3?: number;
  }>;
}

interface RequisitionItem {
  productId: string;
  quantity: number;
  scale: number;
  multiplier: number;
}

const Requisicoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [requisitionItems, setRequisitionItems] = useState<Record<string, RequisitionItem>>({});

  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ['produtos-requisicao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select(`
          *,
          escala_abastecimento!escala_abastecimento_produto_id_fkey (
            escala1,
            escala2,
            escala3
          )
        `)
        .eq('ativo', true)
        .order('produto');
      
      if (error) throw error;
      return data;
    },
  });

  const createRequisitionMutation = useMutation({
    mutationFn: async (items: RequisitionItem[]) => {
      // Primeiro, criar a requisição
      const { data: requisicao, error: requisicaoError } = await supabase
        .from('requisoes')
        .insert([{
          usuario_id: user?.id,
          loja: user?.loja,
          status: 'pendente'
        }])
        .select()
        .single();

      if (requisicaoError) throw requisicaoError;

      // Depois, criar os itens da requisição
      const itensRequisicao = items.map(item => ({
        requisicao_id: requisicao.id,
        produto_id: item.productId,
        quantidade: item.quantity,
        escala: item.scale,
        multiplicador: item.multiplier,
        quantidade_calculada: item.quantity
      }));

      const { error: itensError } = await supabase
        .from('itens_requisicao')
        .insert(itensRequisicao);

      if (itensError) throw itensError;

      return requisicao;
    },
    onSuccess: () => {
      toast.success('Requisição enviada com sucesso!');
      setRequisitionItems({});
      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Erro ao enviar requisição:', error);
      toast.error('Erro ao enviar requisição');
    },
  });

  const filteredProducts = produtos?.filter(product =>
    product.produto && product.produto.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleQuantityChange = (productId: string, quantity: number, scale: number, multiplier: number) => {
    if (quantity > 0) {
      setRequisitionItems(prev => ({
        ...prev,
        [productId]: { productId, quantity, scale, multiplier }
      }));
    } else {
      setRequisitionItems(prev => {
        const newItems = { ...prev };
        delete newItems[productId];
        return newItems;
      });
    }
  };

  const handleSubmitRequisition = () => {
    const items = Object.values(requisitionItems).filter(item => item.quantity > 0);
    
    if (items.length === 0) {
      toast.error('Adicione pelo menos um produto à requisição');
      return;
    }

    createRequisitionMutation.mutate(items);
  };

  const totalItems = Object.keys(requisitionItems).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar produtos</p>
          <Button onClick={() => navigate('/dashboard')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Nova Requisição</h1>
                <p className="text-sm text-gray-500">{user?.loja}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                <p className="text-xs text-gray-500">Requisitante</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Summary */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {totalItems} produtos selecionados
            </div>
            <Button 
              onClick={handleSubmitRequisition}
              disabled={totalItems === 0 || createRequisitionMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createRequisitionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Requisição
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-3">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">
                  {searchTerm ? 'Nenhum produto encontrado com esse nome' : 'Nenhum produto cadastrado'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuantityChange={handleQuantityChange}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Requisicoes;
