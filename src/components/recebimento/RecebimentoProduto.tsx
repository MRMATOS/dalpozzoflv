
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus, Undo2, Trash2 } from "lucide-react";
import { toast } from 'sonner';
import TipoCaixaSelector from './TipoCaixaSelector';
import PalletsVisualizacao from './PalletsVisualizacao';
import { useProdutosComPai } from '@/hooks/useProdutosComPai';
import { useProdutosPedido } from '@/hooks/useProdutosPedido';

interface Pallet {
  id: string;
  ordem: number;
  peso_kg: number;
}

interface Produto {
  id: string;
  produto_id: string;
  produto_nome: string;
  peso_bruto_kg: number;
  peso_liquido_kg: number;
  quantidade_caixas: number;
  tipo_caixa_nome?: string;
  tara_caixas_kg: number;
  tara_pallets_kg: number;
  pallets_utilizados: number[];
}

interface RecebimentoProdutoProps {
  recebimentoId: string;
  pallets: Pallet[];
  produtos: Produto[];
  onProdutoAdded: () => void;
  recebimento?: any;
  pedidoOrigemId?: string;
  tipoOrigem?: 'compra' | 'simples';
}

const RecebimentoProduto: React.FC<RecebimentoProdutoProps> = ({
  recebimentoId,
  pallets,
  produtos,
  onProdutoAdded,
  recebimento,
  pedidoOrigemId,
  tipoOrigem
}) => {
  const [formData, setFormData] = useState({
    produto_id: '',
    peso_bruto: '',
    quantidade_caixas: '',
    tipo_caixa_id: '',
    loja_destino: 'Home Center'
  });
  const [palletsUtilizados, setPalletsUtilizados] = useState<number[]>([]);
  const [palletsIndisponiveis, setPalletsIndisponiveis] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const isModoMedia = recebimento?.modo_pesagem === 'media';
  const isModoSemPalete = recebimento?.modo_pesagem === 'sem_palete';
  const primeiroProdutoRegistrado = produtos.length > 0;
  const produtoTravado = isModoMedia && primeiroProdutoRegistrado ? produtos[0].produto_nome : null;

  const { produtos: produtosDisponiveis } = useProdutosComPai();
  const { produtos: produtosPedido } = useProdutosPedido(pedidoOrigemId, tipoOrigem);
  
  // Usar produtos do pedido se disponível, senão usar todos os produtos
  const produtosParaExibir = produtosPedido.length > 0 ? produtosPedido : produtosDisponiveis;

  const { data: tiposCaixa, refetch: refetchTiposCaixa } = useQuery({
    queryKey: ['tipos-caixa-recebimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_caixas')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });

  const { data: lojas } = useQuery({
    queryKey: ['lojas-recebimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lojas')
        .select('nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    const ultimoTipoCaixa = localStorage.getItem('ultimo-tipo-caixa-recebimento');
    const ultimoProduto = localStorage.getItem('ultimo-produto-recebimento');
    const ultimaQuantidade = localStorage.getItem('ultima-quantidade-recebimento');
    
    if (ultimoTipoCaixa) {
      setFormData(prev => ({ ...prev, tipo_caixa_id: ultimoTipoCaixa }));
    }
    if (ultimoProduto && !produtoTravado) {
      setFormData(prev => ({ ...prev, produto_id: ultimoProduto }));
    }
    if (ultimaQuantidade) {
      setFormData(prev => ({ ...prev, quantidade_caixas: ultimaQuantidade }));
    }
  }, [produtoTravado]);

  useEffect(() => {
    const palletsUsados = produtos.reduce((acc: number[], produto) => {
      return acc.concat(produto.pallets_utilizados || []);
    }, []);
    setPalletsIndisponiveis(palletsUsados);
    
    // Auto-selecionar próximo palete no modo individual
    if (recebimento?.modo_pesagem === 'individual' && pallets.length > 0) {
      const palletsDisponiveis = pallets
        .filter(p => !palletsUsados.includes(p.ordem))
        .sort((a, b) => a.ordem - b.ordem);
      
      if (palletsDisponiveis.length > 0 && palletsUtilizados.length === 0) {
        setPalletsUtilizados([palletsDisponiveis[0].ordem]);
      }
    }
  }, [produtos, pallets, recebimento?.modo_pesagem]);

  const calcularTara = () => {
    // No modo sem palete, não há tara de pallets
    const taraPallets = isModoSemPalete ? 0 : palletsUtilizados.reduce((acc, ordem) => {
      const pallet = pallets.find(p => p.ordem === ordem);
      return acc + (pallet?.peso_kg || 0);
    }, 0);

    const tipoCaixa = tiposCaixa?.find(t => t.id === formData.tipo_caixa_id);
    const isSemCaixa = formData.tipo_caixa_id === 'sem-caixa';
    const taraCaixas = isSemCaixa ? 0 : (tipoCaixa ? tipoCaixa.tara_kg * parseInt(formData.quantidade_caixas || '0') : 0);

    return { taraPallets, taraCaixas };
  };

  const { taraPallets, taraCaixas } = calcularTara();
  const pesoBruto = parseFloat(formData.peso_bruto || '0');
  const pesoLiquido = pesoBruto - taraPallets - taraCaixas;

  const adicionarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    const produtoId = produtoTravado ? produtos[0].produto_id : formData.produto_id;
    if (!produtoId || !formData.peso_bruto || pesoBruto <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (pesoLiquido <= 0) {
      toast.error('Peso líquido deve ser positivo. Verifique o peso bruto e as taras.');
      return;
    }

    setLoading(true);
    try {
      const produto = produtosParaExibir?.find(p => p.id === produtoId);
      const tipoCaixa = tiposCaixa?.find(t => t.id === formData.tipo_caixa_id);
      const isSemCaixa = formData.tipo_caixa_id === 'sem-caixa';

      const { error } = await supabase
        .from('recebimentos_produtos')
        .insert({
          recebimento_id: recebimentoId,
          produto_id: produtoId,
          produto_nome: produto?.display_name || produto?.produto || '',
          peso_bruto_kg: pesoBruto,
          peso_liquido_kg: pesoLiquido,
          quantidade_caixas: parseInt(formData.quantidade_caixas || '0'),
          tipo_caixa_id: isSemCaixa ? null : formData.tipo_caixa_id || null,
          tipo_caixa_nome: isSemCaixa ? 'Sem Caixa' : (tipoCaixa?.nome || null),
          tara_caixas_kg: taraCaixas,
          tara_pallets_kg: taraPallets,
          pallets_utilizados: isModoSemPalete ? [] : palletsUtilizados,
          loja_destino: formData.loja_destino
        });

      if (error) throw error;

      // Salvar últimas seleções no localStorage
      if (formData.tipo_caixa_id) {
        localStorage.setItem('ultimo-tipo-caixa-recebimento', formData.tipo_caixa_id);
      }
      if (!produtoTravado && formData.produto_id) {
        localStorage.setItem('ultimo-produto-recebimento', formData.produto_id);
      }
      if (formData.quantidade_caixas) {
        localStorage.setItem('ultima-quantidade-recebimento', formData.quantidade_caixas);
      }

      // Otimização do foco: manter produto e tipo de caixa após primeiro registro
      setFormData(prev => ({
        produto_id: (produtoTravado || (primeiroProdutoRegistrado && !isModoSemPalete)) ? prev.produto_id : '',
        peso_bruto: '',
        quantidade_caixas: isModoSemPalete ? '' : prev.quantidade_caixas, // Zerar qtd no modo sem palete
        tipo_caixa_id: prev.tipo_caixa_id,
        loja_destino: prev.loja_destino
      }));
      setPalletsUtilizados([]);
      
      onProdutoAdded();
      toast.success('Produto registrado com sucesso!');

      // Auto-focus no campo peso bruto após 100ms
      setTimeout(() => {
        const pesoBrutoInput = document.getElementById('peso_bruto');
        if (pesoBrutoInput) {
          pesoBrutoInput.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao registrar produto');
    } finally {
      setLoading(false);
    }
  };

  const desfazerUltimoProduto = async () => {
    if (produtos.length === 0) {
      toast.error('Nenhum produto para desfazer');
      return;
    }

    const ultimoProduto = produtos[produtos.length - 1];
    
    if (!confirm(`Desfazer produto "${ultimoProduto.produto_nome}"?`)) return;

    try {
      const { error } = await supabase
        .from('recebimentos_produtos')
        .delete()
        .eq('id', ultimoProduto.id);

      if (error) throw error;

      onProdutoAdded();
      toast.success('Produto desfeito com sucesso!');
    } catch (error) {
      console.error('Erro ao desfazer produto:', error);
      toast.error('Erro ao desfazer produto');
    }
  };

  const handleTipoCaixaChange = (value: string) => {
    if (value === 'nova-caixa') {
      return;
    }
    setFormData(prev => ({ ...prev, tipo_caixa_id: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, nextFieldId?: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextFieldId) {
        const nextField = document.getElementById(nextFieldId);
        if (nextField) {
          nextField.focus();
        }
      } else {
        // Se não há próximo campo, submeter o formulário
        adicionarProduto(e as any);
      }
    }
  };

  const editarProduto = async (produtoId: string) => {
    // Implementar edição de produto
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const excluirProduto = async (produtoId: string, produtoNome: string) => {
    if (!confirm(`Excluir produto "${produtoNome}"?`)) return;

    try {
      const { error } = await supabase
        .from('recebimentos_produtos')
        .delete()
        .eq('id', produtoId);

      if (error) throw error;

      onProdutoAdded();
      toast.success('Produto excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Registrar Produto
            </div>
            {produtos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={desfazerUltimoProduto}
                className="text-orange-600 hover:text-orange-700"
              >
                <Undo2 className="h-4 w-4 mr-1" />
                Desfazer Último
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Registre o peso bruto e deixe o sistema calcular automaticamente o peso líquido
            {isModoSemPalete && " • Modo sem palete ativo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionarProduto} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto *</Label>
                {produtoTravado ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">{produtoTravado}</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      Modo média ativo: todos os pallets devem ser usados para o mesmo produto
                    </p>
                  </div>
                ) : (
                  <Select
                    value={formData.produto_id}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, produto_id: value }));
                      // Auto-focus no próximo campo após seleção
                      setTimeout(() => {
                        const nextField = document.getElementById('quantidade_caixas');
                        if (nextField) nextField.focus();
                      }, 100);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtosParaExibir?.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.display_name || produto.produto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Loja Destino</Label>
                <Select
                  value={formData.loja_destino}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, loja_destino: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lojas?.map((loja) => (
                      <SelectItem key={loja.nome} value={loja.nome}>
                        {loja.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Caixa</Label>
                <TipoCaixaSelector
                  tiposCaixa={tiposCaixa || []}
                  value={formData.tipo_caixa_id}
                  onValueChange={(value) => {
                    handleTipoCaixaChange(value);
                    // Auto-focus após seleção
                    setTimeout(() => {
                      const nextField = document.getElementById('quantidade_caixas');
                      if (nextField) nextField.focus();
                    }, 100);
                  }}
                  onTiposUpdated={refetchTiposCaixa}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantidade_caixas">Quantidade de Caixas</Label>
                <Input
                  id="quantidade_caixas"
                  type="number"
                  value={formData.quantidade_caixas}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantidade_caixas: e.target.value }))}
                  onKeyDown={(e) => handleKeyDown(e, 'peso_bruto')}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="peso_bruto">Peso Bruto (kg) *</Label>
                  <Input
                    id="peso_bruto"
                    type="number"
                    step="0.1"
                    value={formData.peso_bruto}
                    onChange={(e) => setFormData(prev => ({ ...prev, peso_bruto: e.target.value }))}
                    onKeyDown={(e) => handleKeyDown(e)}
                    placeholder="Ex: 150.5"
                    required
                    autoFocus
                  />
                </div>

                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="grid grid-cols-3 gap-4 text-sm w-full">
                          <div className="text-center">
                            <div className="text-gray-600">Bruto</div>
                            <div className="font-mono font-bold">{pesoBruto.toFixed(1)} kg</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Tara Total</div>
                            <div className="font-mono font-bold text-orange-600">-{(taraPallets + taraCaixas).toFixed(1)} kg</div>
                          </div>
                          <div className="text-center">
                            <div className="text-gray-600">Líquido</div>
                            <div className={`font-mono font-bold text-lg ${pesoLiquido > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {pesoLiquido.toFixed(1)} kg
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button type="submit" disabled={loading || pesoLiquido <= 0} className="w-full bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Registrando...' : 'Registrar Produto'}
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {/* Não mostrar seleção de pallets no modo sem palete */}
              {!isModoSemPalete && (
                <PalletsVisualizacao
                  pallets={pallets}
                  palletsUtilizados={palletsUtilizados}
                  onPalletsChange={setPalletsUtilizados}
                  palletsIndisponiveis={palletsIndisponiveis}
                  modoMedia={isModoMedia}
                  modoIndividual={recebimento?.modo_pesagem === 'individual'}
                />
              )}

              {/* Exibir informação para modo sem palete */}
              {isModoSemPalete && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-sm text-yellow-700 font-medium">Modo Sem Palete</div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Produtos grandes ou unitários - sem necessidade de pallets
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Registrados</CardTitle>
          <CardDescription>
            {produtos.length} produtos - Peso líquido total: {produtos.reduce((acc, p) => acc + p.peso_liquido_kg, 0).toFixed(1)} kg
          </CardDescription>
        </CardHeader>
        <CardContent>
          {produtos.length > 0 ? (
            <div className="space-y-4">
              {produtos.map((produto, index) => (
                <div key={produto.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{produto.produto_nome}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editarProduto(produto.id)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        title="Editar produto"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => excluirProduto(produto.id, produto.produto_nome)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Excluir produto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>Peso Bruto: <span className="font-mono">{produto.peso_bruto_kg.toFixed(1)} kg</span></div>
                    <div>Peso Líquido: <span className="font-mono font-bold text-green-600">{produto.peso_liquido_kg.toFixed(1)} kg</span></div>
                    <div>Caixas: {produto.quantidade_caixas} {produto.tipo_caixa_nome && `(${produto.tipo_caixa_nome})`}</div>
                    <div>Pallets: {isModoSemPalete ? 'N/A' : (produto.pallets_utilizados && produto.pallets_utilizados.length > 0 ? produto.pallets_utilizados.join(', ') : 'Nenhum')}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum produto registrado ainda</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecebimentoProduto;
