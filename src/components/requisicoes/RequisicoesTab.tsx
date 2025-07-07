import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Search, Send, Truck, X } from 'lucide-react';
import ProductCard from '@/components/requisicoes/ProductCard';
import { useTransferencias } from '@/hooks/useTransferencias';

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

const RequisicoesTab = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { criarTransferencias } = useTransferencias();
  const [searchTerm, setSearchTerm] = useState('');
  const [requisitionItems, setRequisitionItems] = useState<Record<string, RequisitionItem>>({});

  // Buscar loja CD
  const { data: cdLoja } = useQuery({
    queryKey: ['cd-loja'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojas')
        .select('nome')
        .eq('is_cd', true)
        .eq('ativo', true)
        .single();
      
      if (error) throw error;
      return data?.nome || 'Home Center';
    },
  });

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

  // Buscar requisições pendentes da loja do usuário
  const { data: requisicoesPendentes } = useQuery({
    queryKey: ['requisicoes-pendentes', profile?.loja],
    queryFn: async () => {
      if (!profile?.loja) return [];
      
      const { data, error } = await supabase
        .from('requisicoes')
        .select(`
          id,
          loja,
          status,
          data_requisicao,
          usuario_id,
          itens_requisicao(
            produto_id,
            quantidade,
            quantidade_calculada,
            produtos(produto, unidade, media_por_caixa)
          )
        `)
        .eq('loja', profile.loja)
        .eq('status', 'pendente')
        .order('data_requisicao', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.loja,
  });

  const createRequisitionMutation = useMutation({
    mutationFn: async (items: RequisitionItem[]) => {
      if (!user?.id || !profile?.loja) {
        throw new Error('Usuário ou loja não identificados');
      }

      // Criar a requisição direcionada para a loja CD
      const requisicaoData = {
        usuario_id: user.id,
        loja: profile.loja,
        status: 'pendente'
      };

      const { data: requisicao, error: requisicaoError } = await supabase
        .from('requisicoes')
        .insert([requisicaoData])
        .select()
        .single();

      if (requisicaoError) throw requisicaoError;

      // Criar os itens da requisição
      const itensRequisicao = items.map(item => ({
        requisicao_id: requisicao.id,
        produto_id: item.productId,
        quantidade: item.caixas,
        quantidade_calculada: item.quilos,
        escala: null,
        multiplicador: null
      }));

      const { error: itensError } = await supabase
        .from('itens_requisicao')
        .insert(itensRequisicao);

      if (itensError) throw itensError;

      return requisicao;
    },
    onSuccess: () => {
      toast.success('Requisição criada com sucesso!');
      setRequisitionItems({});
      queryClient.invalidateQueries({ queryKey: ['produtos-requisicao'] });
      queryClient.invalidateQueries({ queryKey: ['requisicoes-pendentes'] });
    },
    onError: (error) => {
      console.error('Erro ao criar requisição:', error);
      toast.error(`Erro ao criar requisição: ${error.message}`);
    },
  });

  const cancelarRequisicaoMutation = useMutation({
    mutationFn: async (requisicaoId: string) => {
      const { error } = await supabase
        .from('requisicoes')
        .update({ status: 'cancelada' })
        .eq('id', requisicaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requisição cancelada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['requisicoes-pendentes'] });
    },
    onError: (error) => {
      console.error('Erro ao cancelar requisição:', error);
      toast.error('Erro ao cancelar requisição');
    },
  });

  const enviarParaCDMutation = useMutation({
    mutationFn: async (requisicaoId: string) => {
      const result = await criarTransferencias(requisicaoId);
      if (!result.success) {
        throw new Error('Erro ao enviar para CD');
      }
      return result;
    },
    onSuccess: () => {
      toast.success('Requisição enviada para o Centro de Distribuição!');
      queryClient.invalidateQueries({ queryKey: ['requisicoes-pendentes'] });
    },
    onError: (error) => {
      console.error('Erro ao enviar para CD:', error);
      toast.error('Erro ao enviar requisição para CD');
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

    if (!user?.id) {
      toast.error('Usuário não identificado. Faça login novamente.');
      return;
    }
    
    createRequisitionMutation.mutate(items);
  };

  const handleEnviarParaCD = (requisicaoId: string) => {
    enviarParaCDMutation.mutate(requisicaoId);
  };

  const handleCancelarRequisicao = (requisicaoId: string) => {
    cancelarRequisicaoMutation.mutate(requisicaoId);
  };

  const totalItems = Object.keys(requisitionItems).length;
  const totalCaixas = Object.values(requisitionItems).reduce((sum, item) => sum + item.caixas, 0);
  const totalQuilos = Object.values(requisitionItems).reduce((sum, item) => sum + item.quilos, 0);

  // Verificar se usuário pode cancelar requisições (criador ou master)
  const podeCancel = (requisicao: any) => {
    return requisicao.usuario_id === user?.id || profile?.tipo === 'master';
  };

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
          <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controles Fixos */}
      <div className="bg-white border-b sticky top-32 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Busca e Criar Nova */}
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
              Criar Requisição
            </Button>
          </div>

          {/* Resumo Nova Requisição */}
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

      {/* Requisições Pendentes */}
      {requisicoesPendentes && requisicoesPendentes.length > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h2 className="text-sm font-medium text-yellow-800 mb-3">Requisições Pendentes</h2>
            <div className="space-y-2">
              {requisicoesPendentes.map((req) => {
                const totalItens = (req.itens_requisicao as any[]).length;
                const totalCaixas = (req.itens_requisicao as any[]).reduce((sum, item) => sum + (item.quantidade || 0), 0);
                const totalQuilos = (req.itens_requisicao as any[]).reduce((sum, item) => sum + (item.quantidade_calculada || 0), 0);
                
                return (
                  <div key={req.id} className="flex items-center justify-between bg-white p-3 rounded border border-yellow-200">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        Requisição #{req.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {totalItens} produtos • {totalCaixas} caixas • {totalQuilos.toFixed(1)}kg
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(req.data_requisicao).toLocaleDateString('pt-BR')} às {new Date(req.data_requisicao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {podeCancel(req) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelarRequisicao(req.id)}
                          disabled={cancelarRequisicaoMutation.isPending}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleEnviarParaCD(req.id)}
                        disabled={enviarParaCDMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {enviarParaCDMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Truck className="h-4 w-4 mr-2" />
                        )}
                        Enviar para CD
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Lista de Produtos - Scrollável */}
      <main className="flex-1 overflow-auto">
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
      </main>
    </div>
  );
};

export default RequisicoesTab;