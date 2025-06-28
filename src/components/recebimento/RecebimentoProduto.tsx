
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus, Calculator, AlertTriangle, Undo2 } from "lucide-react";
import { toast } from 'sonner';
import TipoCaixaSelector from './TipoCaixaSelector';
import PalletsVisualizacao from './PalletsVisualizacao';
import { useProdutosComPai } from '@/hooks/useProdutosComPai';

interface Pallet {
  id: string;
  ordem: number;
  peso_kg: number;
}

interface Produto {
  id: string;
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
}

const RecebimentoProduto: React.FC<RecebimentoProdutoProps> = ({
  recebimentoId,
  pallets,
  produtos,
  onProdutoAdded
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

  // Usar o hook para produtos com pai que mostra todas as variações
  const { produtos: produtosDisponiveis } = useProdutosComPai();

  // Buscar tipos de caixa
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

  // Buscar lojas ativas
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

  // Carregar último tipo de caixa usado
  useEffect(() => {
    const ultimoTipoCaixa = localStorage.getItem('ultimo-tipo-caixa-recebimento');
    if (ultimoTipoCaixa) {
      setFormData(prev => ({ ...prev, tipo_caixa_id: ultimoTipoCaixa }));
    }
  }, []);

  // Calcular pallets indisponíveis baseado nos produtos já registrados
  useEffect(() => {
    const palletsUsados = produtos.reduce((acc: number[], produto) => {
      return acc.concat(produto.pallets_utilizados || []);
    }, []);
    setPalletsIndisponiveis(palletsUsados);
  }, [produtos]);

  // Calcular tara automaticamente
  const calcularTara = () => {
    const taraPallets = palletsUtilizados.reduce((acc, ordem) => {
      const pallet = pallets.find(p => p.ordem === ordem);
      return acc + (pallet?.peso_kg || 0);
    }, 0);

    const tipoCaixa = tiposCaixa?.find(t => t.id === formData.tipo_caixa_id);
    const taraCaixas = tipoCaixa ? tipoCaixa.tara_kg * parseInt(formData.quantidade_caixas || '0') : 0;

    return { taraPallets, taraCaixas };
  };

  const { taraPallets, taraCaixas } = calcularTara();
  const pesoBruto = parseFloat(formData.peso_bruto || '0');
  const pesoLiquido = pesoBruto - taraPallets - taraCaixas;

  const adicionarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.produto_id || !formData.peso_bruto || pesoBruto <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (pesoLiquido <= 0) {
      toast.error('Peso líquido deve ser positivo. Verifique o peso bruto e as taras.');
      return;
    }

    setLoading(true);
    try {
      const produto = produtosDisponiveis?.find(p => p.id === formData.produto_id);
      const tipoCaixa = tiposCaixa?.find(t => t.id === formData.tipo_caixa_id);

      const { error } = await supabase
        .from('recebimentos_produtos')
        .insert({
          recebimento_id: recebimentoId,
          produto_id: formData.produto_id,
          produto_nome: produto?.display_name || produto?.produto || '',
          peso_bruto_kg: pesoBruto,
          peso_liquido_kg: pesoLiquido,
          quantidade_caixas: parseInt(formData.quantidade_caixas || '0'),
          tipo_caixa_id: formData.tipo_caixa_id || null,
          tipo_caixa_nome: tipoCaixa?.nome || null,
          tara_caixas_kg: taraCaixas,
          tara_pallets_kg: taraPallets,
          pallets_utilizados: palletsUtilizados,
          loja_destino: formData.loja_destino
        });

      if (error) throw error;

      // Salvar último tipo de caixa usado
      if (formData.tipo_caixa_id) {
        localStorage.setItem('ultimo-tipo-caixa-recebimento', formData.tipo_caixa_id);
      }

      // Resetar formulário mas manter tipo de caixa
      setFormData(prev => ({
        produto_id: '',
        peso_bruto: '',
        quantidade_caixas: '',
        tipo_caixa_id: prev.tipo_caixa_id, // Mantém o último tipo selecionado
        loja_destino: prev.loja_destino
      }));
      setPalletsUtilizados([]);
      
      onProdutoAdded();
      toast.success('Produto registrado com sucesso!');
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
      // O modal será aberto pelo TipoCaixaSelector
      return;
    }
    setFormData(prev => ({ ...prev, tipo_caixa_id: value }));
  };

  return (
    <div className="space-y-6">
      {/* Formulário para registrar produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Registrar Produto Recebido
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
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionarProduto} className="space-y-6">
            {/* Linha 1: Produto e Loja Destino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto *</Label>
                <Select
                  value={formData.produto_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, produto_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtosDisponiveis?.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.display_name || produto.produto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Linha 2: Tipo de Caixa e Quantidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Caixa</Label>
                <TipoCaixaSelector
                  tiposCaixa={tiposCaixa || []}
                  value={formData.tipo_caixa_id}
                  onValueChange={handleTipoCaixaChange}
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
                  placeholder="0"
                />
              </div>
            </div>

            {/* Linha 3: Peso Bruto e Pallets */}
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
                    placeholder="Ex: 150.5"
                    required
                  />
                </div>

                {/* Card de Cálculo Automático - Abaixo do peso bruto */}
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Calculator className="h-5 w-5 text-blue-600" />
                        <div className="grid grid-cols-3 gap-4 text-sm">
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
                      {pesoLiquido <= 0 && (
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <PalletsVisualizacao
                pallets={pallets}
                palletsUtilizados={palletsUtilizados}
                onPalletsChange={setPalletsUtilizados}
                palletsIndisponiveis={palletsIndisponiveis}
              />
            </div>

            <Button type="submit" disabled={loading || pesoLiquido <= 0} className="w-full">
              {loading ? 'Registrando...' : 'Registrar Produto'}
              <Plus className="h-4 w-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de produtos registrados */}
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
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                    <div>Peso Bruto: <span className="font-mono">{produto.peso_bruto_kg.toFixed(1)} kg</span></div>
                    <div>Peso Líquido: <span className="font-mono font-bold text-green-600">{produto.peso_liquido_kg.toFixed(1)} kg</span></div>
                    <div>Caixas: {produto.quantidade_caixas} {produto.tipo_caixa_nome && `(${produto.tipo_caixa_nome})`}</div>
                    <div>Pallets: {produto.pallets_utilizados && produto.pallets_utilizados.length > 0 ? produto.pallets_utilizados.join(', ') : 'Nenhum'}</div>
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
