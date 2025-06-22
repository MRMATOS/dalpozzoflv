
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
  media_por_caixa?: number;
}

interface RequisitionItem {
  productId: string;
  caixas: number;
  quilos: number;
}

const Requisicoes = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [requisitionItems, setRequisitionItems] = useState<Record<string, RequisitionItem>>({});

  const { data: produtos, isLoading, error } = useQuery({
    queryKey: ['produtos-requisicao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, produto, unidade, media_por_caixa')
        .eq('ativo', true)
        .order('produto');
      
      if (error) throw error;
      return data;
    },
  });

  const createRequisitionMutation = useMutation({
    mutationFn: async (items: RequisitionItem[]) => {
      console.log('Criando requisição para a loja:', profile?.loja);
      console.log('Items da requisição:', items);

      // Primeiro, criar a requisição
      const { data: requisicao, error: requisicaoError } = await supabase
        .from('requisicoes')
        .insert([{
          usuario_id: user?.id,
          user_id: user?.id,
          loja: profile?.loja,
          status: 'pendente'
        }])
        .select()
        .single();

      if (requisicaoError) {
        console.error('Erro ao criar requisição:', requisicaoError);
        throw requisicaoError;
      }

      console.log('Requisição criada:', requisicao);

      // Depois, criar os itens da requisição
      const itensRequisicao = items.map(item => ({
        requisicao_id: requisicao.id,
        produto_id: item.productId,
        quantidade: item.caixas,
        quantidade_calculada: item.quilos,
        escala: null,
        multiplicador: null
      }));

      console.log('Inserindo itens da requisição:', itensRequisicao);

      const { error: itensError } = await supabase
        .from('itens_requisicao')
        .insert(itensRequisicao);

      if (itensError) {
        console.error('Erro ao inserir itens da requisição:', itensError);
        throw itensError;
      }

      return requisicao;
    },
    onSuccess: () => {
      toast.success('Requisição enviada com sucesso!');
      setRequisitionItems({});
      queryClient.invalidateQueries({ queryKey: ['produtos-requisicao'] });
      queryClient.invalidateQueries({ queryKey: ['requisicoes'] });
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

  const handleQuantityChange = (productId: string, caixas: number, quilos: number) => {
    if (caixas > 0) {
      setRequisitionItems(prev => ({
        ...prev,
        [productId]: { productId, caixas, quilos }
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
    const items = Object.values(requisitionItems).filter(item => item.caixas > 0);
    
    if (items.length === 0) {
      toast.error('Adicione pelo menos um produto à requisição');
      return;
    }

    if (!profile?.loja) {
      toast.error('Loja não identificada. Faça login novamente.');
      return;
    }

    console.log('Enviando requisição com os itens:', items);
    console.log('Usuário:', user);
    console.log('Profile:', profile);
    createRequisitionMutation.mutate(items);
  };

  const totalItems = Object.keys(requisitionItems).length;
  const totalCaixas = Object.values(requisitionItems).reduce((sum, item) => sum + item.caixas, 0);
  const totalQuilos = Object.values(requisitionItems).reduce((sum, item) => sum + item.quilos, 0);

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Fixo */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
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
                <h1 className="text-lg font-semibold text-gray-900">Requisição</h1>
                <p className="text-sm text-gray-500">{profile?.loja}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/historico-requisicoes')}
              >
                <Search className="h-4 w-4 mr-2" />
                Histórico
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Controles Fixos */}
      <div className="bg-white border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Busca e Envio */}
          <div className="mb-4 flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button 
              onClick={handleSubmitRequisition}
              disabled={totalItems === 0 || createRequisitionMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
            >
              {createRequisitionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </div>

          {/* Resumo */}
          {totalItems > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">{totalItems} produtos selecionados</span>
                <span className="ml-4">{totalCaixas} caixas • {totalQuilos.toFixed(1)}kg</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Produtos - Scrollável */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
        </div>
      </div>
    </div>
  );
};

export default Requisicoes;
