import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Package, 
  Scale, 
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import PesagemPallets from '@/components/recebimento/PesagemPallets';
import RecebimentoProduto from '@/components/recebimento/RecebimentoProduto';
import { toast } from 'sonner';
import CancelRecebimentoButton from '@/components/recebimento/CancelRecebimentoButton';
import { useIsMobile } from '@/hooks/use-mobile';

const RecebimentoAtivo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();

  // Buscar dados do recebimento
  const { data: recebimento, refetch } = useQuery({
    queryKey: ['recebimento', id],
    queryFn: async () => {
      if (!id) throw new Error('ID do recebimento não fornecido');
      
      const { data, error } = await supabase
        .from('recebimentos')
        .select(`
          *,
          recebimentos_pallets(*),
          recebimentos_produtos(
            *,
            produtos(produto),
            tipos_caixas(nome, tara_kg)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const finalizarRecebimento = async () => {
    if (!id || !profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('recebimentos')
        .update({
          status: 'finalizado',
          finalizado_por: profile.id,
          finalizado_em: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Marcar todos os produtos como tendo estoque atualizado
      const { error: errorProdutos } = await supabase
        .from('recebimentos_produtos')
        .update({ estoque_atualizado: true })
        .eq('recebimento_id', id)
        .eq('estoque_atualizado', false);

      if (errorProdutos) throw errorProdutos;

      toast.success('Recebimento finalizado e estoque atualizado!');
      navigate('/recebimento');
    } catch (error) {
      console.error('Erro ao finalizar recebimento:', error);
      toast.error('Erro ao finalizar recebimento');
    } finally {
      setLoading(false);
    }
  };

  if (!recebimento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Carregando recebimento...</p>
        </div>
      </div>
    );
  }

  const pallets = recebimento.recebimentos_pallets || [];
  const produtos = recebimento.recebimentos_produtos || [];
  const podeSerFinalizado = produtos.length > 0;

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
                onClick={() => navigate('/recebimento')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <CancelRecebimentoButton recebimentoId={id!} />
              {podeSerFinalizado && (
                <Button
                  onClick={finalizarRecebimento}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Finalizando...' : 'Finalizar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Título e status abaixo do header */}
      <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-medium text-gray-600">Recebimento Ativo</h1>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
              {recebimento.status}
            </Badge>
            {recebimento.fornecedor && (
              <span className="text-sm text-gray-500">{recebimento.fornecedor}</span>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="pallets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pallets">
              Pallets ({pallets.length})
            </TabsTrigger>
            <TabsTrigger value="produtos">
              Produtos ({produtos.length})
            </TabsTrigger>
            <TabsTrigger value="resumo">
              Resumo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pallets">
            <PesagemPallets 
              recebimentoId={id!} 
              pallets={pallets}
              onPalletAdded={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="produtos">
            <RecebimentoProduto 
              recebimentoId={id!}
              pallets={pallets}
              produtos={produtos}
              onProdutoAdded={() => refetch()}
            />
          </TabsContent>

          <TabsContent value="resumo">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Scale className="h-5 w-5 mr-2" />
                    Pallets Registrados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pallets.length}</div>
                  <p className="text-sm text-gray-500">
                    Peso total: {pallets.reduce((acc, p) => acc + (p.peso_kg || 0), 0).toFixed(1)} kg
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Produtos Recebidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{produtos.length}</div>
                  <p className="text-sm text-gray-500">
                    Peso líquido: {produtos.reduce((acc, p) => acc + (p.peso_liquido_kg || 0), 0).toFixed(1)} kg
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pallets:</span>
                      <Badge variant={pallets.length > 0 ? "default" : "secondary"}>
                        {pallets.length > 0 ? "Registrados" : "Pendente"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Produtos:</span>
                      <Badge variant={produtos.length > 0 ? "default" : "secondary"}>
                        {produtos.length > 0 ? "Registrados" : "Pendente"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Finalização:</span>
                      <Badge variant={podeSerFinalizado ? "default" : "secondary"}>
                        {podeSerFinalizado ? "Disponível" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {recebimento.observacoes && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{recebimento.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RecebimentoAtivo;
