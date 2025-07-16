
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, Plus, Scale, Users, FileX } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import EtapasRecebimento from '@/components/recebimento/EtapasRecebimento';

const NovoRecebimento = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    modo_pesagem: 'individual',
    quantidade_pallets: '',
    peso_total: ''
  });

  const pedidoId = searchParams.get('pedido_id');
  const tipoPedido = searchParams.get('tipo') as 'compra' | 'simples';

  // Buscar dados do pedido selecionado
  const { data: pedidoSelecionado } = useQuery({
    queryKey: ['pedido-selecionado', pedidoId, tipoPedido],
    queryFn: async () => {
      if (!pedidoId || !tipoPedido) return null;
      
      if (tipoPedido === 'compra') {
        const { data, error } = await supabase
          .from('pedidos_compra')
          .select(`
            *,
            fornecedores(nome),
            itens_pedido(
              id,
              produto_id,
              quantidade,
              preco,
              produtos(produto)
            )
          `)
          .eq('id', pedidoId)
          .single();
        
        if (error) throw error;
        return { ...data, tipo: 'compra', fornecedor: data.fornecedores?.nome };
      } else {
        const { data, error } = await supabase
          .from('pedidos_simples')
          .select('*')
          .eq('id', pedidoId)
          .single();
        
        if (error) throw error;
        return { ...data, tipo: 'simples', fornecedor: data.fornecedor_nome };
      }
    },
    enabled: !!pedidoId && !!tipoPedido,
  });

  // Redirecionar para seleção de pedidos se não tiver pedido selecionado
  useEffect(() => {
    if (!pedidoId || !tipoPedido) {
      console.log('Redirecionando para seleção de pedidos - Missing:', { pedidoId, tipoPedido });
      navigate('/recebimento/pedidos');
    }
  }, [pedidoId, tipoPedido, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !pedidoSelecionado) return;

      // Validações para modo média
      if (formData.modo_pesagem === 'media') {
        if (!formData.quantidade_pallets || !formData.peso_total) {
          toast.error('Preencha quantidade de pallets e peso total para o modo média');
          return;
        }
        
      const quantidade = parseInt(formData.quantidade_pallets);
      if (quantidade < 2) {
        toast.error('Não é possível criar recebimento com apenas 1 pallet. Mínimo: 2 pallets');
        return;
      }
      }

      // Para modo sem palete, não fazer validações de pallet
      if (formData.modo_pesagem === 'sem_palete') {
        // Nenhuma validação específica necessária
      }

    setLoading(true);
    try {
      const pesoMedio = formData.modo_pesagem === 'media' 
        ? parseFloat(formData.peso_total) / parseInt(formData.quantidade_pallets)
        : null;

      const { data, error } = await supabase
        .from('recebimentos')
        .insert({
          fornecedor: pedidoSelecionado.fornecedor,
          iniciado_por: profile.id,
          status: 'iniciado',
          modo_pesagem: formData.modo_pesagem,
          quantidade_pallets_informada: formData.modo_pesagem === 'media' ? parseInt(formData.quantidade_pallets) : null,
          peso_total_informado: formData.modo_pesagem === 'media' ? parseFloat(formData.peso_total) : null,
          peso_medio_calculado: pesoMedio,
          pedido_origem_id: pedidoId,
          tipo_origem: tipoPedido
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Recebimento iniciado com sucesso!');
      navigate(`/recebimento/${data.id}`);
    } catch (error) {
      console.error('Erro ao criar recebimento:', error);
      toast.error('Erro ao iniciar recebimento');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar logs para debugging
  console.log('NovoRecebimento - State:', { 
    pedidoId, 
    tipoPedido, 
    pedidoSelecionado: !!pedidoSelecionado,
    profile: !!profile 
  });

  if (!pedidoSelecionado && pedidoId && tipoPedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Carregando dados do pedido...</p>
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
                onClick={() => navigate('/recebimento/pedidos')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Configurar Recebimento</h1>
                <p className="text-sm text-gray-500">Fornecedor: {pedidoSelecionado.fornecedor}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Etapa 2/3 - Configurar Modo de Pesagem
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EtapasRecebimento etapaAtual={2} />
        
        {/* Card com dados do pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Pedido Selecionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fornecedor:</span> {pedidoSelecionado.fornecedor}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {pedidoSelecionado.tipo === 'compra' ? 'Pedido de Compra' : 'Pedido Simples'}
              </div>
              <div>
                <span className="font-medium">Data:</span> {new Date(pedidoSelecionado.criado_em).toLocaleDateString('pt-BR')}
              </div>
              <div>
                <span className="font-medium">Valor:</span> R$ {
                  pedidoSelecionado.tipo === 'compra' 
                    ? ((pedidoSelecionado as any).total || 0).toFixed(2)
                    : ((pedidoSelecionado as any).valor_total_estimado || 0).toFixed(2)
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="h-5 w-5 mr-2" />
              Configuração do Modo de Pesagem
            </CardTitle>
            <CardDescription>
              Selecione como deseja registrar o peso dos pallets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label>Modo de Pesagem *</Label>
                  <RadioGroup
                    value={formData.modo_pesagem}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, modo_pesagem: value }))}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Scale className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Pesagem Individual</div>
                            <div className="text-sm text-gray-500">Registrar peso de cada pallet separadamente</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value="media" id="media" />
                      <Label htmlFor="media" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Pesagem por Média</div>
                            <div className="text-sm text-gray-500">Pesar todos os pallets juntos e dividir pela quantidade</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value="sem_palete" id="sem_palete" />
                      <Label htmlFor="sem_palete" className="flex-1 cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <FileX className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Sem Palete</div>
                            <div className="text-sm text-gray-500">Para produtos grandes ou unitários (ex: abóbora)</div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.modo_pesagem === 'media' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="space-y-2">
                      <Label htmlFor="quantidade_pallets">Quantidade de Pallets *</Label>
                      <Input
                        id="quantidade_pallets"
                        type="number"
                        min="2"
                        value={formData.quantidade_pallets}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantidade_pallets: e.target.value }))}
                        placeholder="Ex: 5"
                        required
                      />
                      <p className="text-xs text-gray-600">Mínimo 2 pallets</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="peso_total">Peso Total da Pilha (kg) *</Label>
                      <Input
                        id="peso_total"
                        type="number"
                        step="0.1"
                        value={formData.peso_total}
                        onChange={(e) => setFormData(prev => ({ ...prev, peso_total: e.target.value }))}
                        placeholder="Ex: 125.5"
                        required
                      />
                    </div>
                    {formData.quantidade_pallets && formData.peso_total && (
                      <div className="col-span-2 text-center p-2 bg-green-100 rounded border border-green-200">
                        <span className="text-sm font-medium text-green-800">
                          Peso médio por pallet: {(parseFloat(formData.peso_total) / parseInt(formData.quantidade_pallets)).toFixed(1)} kg
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/recebimento/pedidos')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (formData.modo_pesagem === 'media' && (!formData.quantidade_pallets || !formData.peso_total))}
                  className="flex-1"
                >
                  {loading ? 'Iniciando...' : 'Iniciar Recebimento'}
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default NovoRecebimento;
