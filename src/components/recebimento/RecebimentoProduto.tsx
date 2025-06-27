
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package, Plus, Calculator, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';

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
    produto_nome: '',
    peso_bruto: '',
    quantidade_caixas: '',
    tipo_caixa_id: '',
    loja_destino: 'Home Center'
  });
  const [palletsUtilizados, setPalletsUtilizados] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar produtos disponíveis
  const { data: produtosDisponiveis } = useQuery({
    queryKey: ['produtos-recebimento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, produto, media_por_caixa')
        .eq('ativo', true)
        .order('produto');

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar tipos de caixa
  const { data: tiposCaixa } = useQuery({
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
    
    if (!formData.produto_nome || !formData.peso_bruto || pesoBruto <= 0) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (pesoLiquido <= 0) {
      toast.error('Peso líquido deve ser positivo. Verifique o peso bruto e as taras.');
      return;
    }

    setLoading(true);
    try {
      const tipoCaixa = tiposCaixa?.find(t => t.id === formData.tipo_caixa_id);

      const { error } = await supabase
        .from('recebimentos_produtos')
        .insert({
          recebimento_id: recebimentoId,
          produto_id: formData.produto_id || null,
          produto_nome: formData.produto_nome,
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

      // Resetar formulário
      setFormData({
        produto_id: '',
        produto_nome: '',
        peso_bruto: '',
        quantidade_caixas: '',
        tipo_caixa_id: '',
        loja_destino: 'Home Center'
      });
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

  return (
    <div className="space-y-6">
      {/* Formulário para registrar produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Registrar Produto Recebido
          </CardTitle>
          <CardDescription>
            Registre o peso bruto e deixe o sistema calcular automaticamente o peso líquido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionarProduto} className="space-y-6">
            {/* Seleção/Nome do Produto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={formData.produto_id}
                  onValueChange={(value) => {
                    const produto = produtosDisponiveis?.find(p => p.id === value);
                    setFormData(prev => ({
                      ...prev,
                      produto_id: value,
                      produto_nome: produto?.produto || ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtosDisponiveis?.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.produto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="produto_nome">Nome do Produto *</Label>
                <Input
                  id="produto_nome"
                  value={formData.produto_nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, produto_nome: e.target.value }))}
                  placeholder="Digite o nome do produto"
                  required
                />
              </div>
            </div>

            {/* Peso Bruto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Caixas e Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Tipo de Caixa</Label>
                <Select
                  value={formData.tipo_caixa_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_caixa_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCaixa?.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome} ({tipo.tara_kg} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seleção de Pallets */}
            {pallets.length > 0 && (
              <div className="space-y-3">
                <Label>Pallets Utilizados</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {pallets
                    .sort((a, b) => a.ordem - b.ordem)
                    .map((pallet) => (
                      <div key={pallet.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pallet-${pallet.ordem}`}
                          checked={palletsUtilizados.includes(pallet.ordem)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setPalletsUtilizados(prev => [...prev, pallet.ordem].sort((a, b) => a - b));
                            } else {
                              setPalletsUtilizados(prev => prev.filter(p => p !== pallet.ordem));
                            }
                          }}
                        />
                        <Label htmlFor={`pallet-${pallet.ordem}`} className="text-sm">
                          P{pallet.ordem} ({pallet.peso_kg.toFixed(1)}kg)
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Cálculo Automático */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-blue-800">
                  <Calculator className="h-4 w-4 mr-2" />
                  Cálculo Automático
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Peso Bruto:</span>
                    <div className="font-mono font-bold">{pesoBruto.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tara Pallets:</span>
                    <div className="font-mono font-bold text-orange-600">-{taraPallets.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Tara Caixas:</span>
                    <div className="font-mono font-bold text-orange-600">-{taraCaixas.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Peso Líquido:</span>
                    <div className={`font-mono font-bold text-lg ${pesoLiquido > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pesoLiquido.toFixed(1)} kg
                    </div>
                  </div>
                </div>
                {pesoLiquido <= 0 && (
                  <div className="flex items-center mt-3 text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    <span className="text-sm">Peso líquido inválido. Verifique os valores.</span>
                  </div>
                )}
              </CardContent>
            </Card>

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
                    <div>Pallets: {produto.pallets_utilizados.length > 0 ? produto.pallets_utilizados.join(', ') : 'Nenhum'}</div>
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
