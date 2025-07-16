
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Scale, Plus, Trash2, Users } from "lucide-react";
import { toast } from 'sonner';

interface Pallet {
  id: string;
  ordem: number;
  peso_kg: number;
  observacoes?: string;
  registrado_em: string;
}

interface PesagemPalletsProps {
  recebimentoId: string;
  pallets: Pallet[];
  onPalletAdded: () => void;
  recebimento?: any;
}

const PesagemPallets: React.FC<PesagemPalletsProps> = ({ 
  recebimentoId, 
  pallets, 
  onPalletAdded,
  recebimento 
}) => {
  const [peso, setPeso] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  const adicionarPallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peso || parseFloat(peso) <= 0) {
      toast.error('Informe um peso válido');
      return;
    }

    setLoading(true);
    try {
      const proximaOrdem = Math.max(...pallets.map(p => p.ordem), 0) + 1;

      const { error } = await supabase
        .from('recebimentos_pallets')
        .insert({
          recebimento_id: recebimentoId,
          ordem: proximaOrdem,
          peso_kg: parseFloat(peso),
          observacoes: observacoes || null
        });

      if (error) throw error;

      setPeso('');
      setObservacoes('');
      onPalletAdded();
      toast.success(`Pallet ${proximaOrdem} registrado com sucesso!`);
    } catch (error) {
      console.error('Erro ao adicionar pallet:', error);
      toast.error('Erro ao registrar pallet');
    } finally {
      setLoading(false);
    }
  };

  const removerPallet = async (palletId: string, ordem: number) => {
    // Verificar se é o último pallet e se tem pelo menos 2 pallets
    if (pallets.length <= 2) {
      toast.error('Deve haver pelo menos 2 pallets registrados');
      return;
    }

    try {
      const { error } = await supabase
        .from('recebimentos_pallets')
        .delete()
        .eq('id', palletId);

      if (error) throw error;

      onPalletAdded();
      toast.success(`Pallet ${ordem} removido`);
    } catch (error) {
      console.error('Erro ao remover pallet:', error);
      toast.error('Erro ao remover pallet');
    }
  };

  const pesoTotal = pallets.reduce((acc, pallet) => acc + pallet.peso_kg, 0);
  const isModoMedia = recebimento?.modo_pesagem === 'media';

  const gerarPalletsMedia = async () => {
    if (!recebimento || !recebimento.quantidade_pallets_informada || !recebimento.peso_medio_calculado) return;
    
    // Validar mínimo de 2 pallets
    if (recebimento.quantidade_pallets_informada < 2) {
      toast.error('Quantidade mínima de pallets é 2');
      return;
    }
    
    setLoading(true);
    try {
      const palletsToCreate = [];
      for (let i = 1; i <= recebimento.quantidade_pallets_informada; i++) {
        palletsToCreate.push({
          recebimento_id: recebimentoId,
          ordem: i,
          peso_kg: recebimento.peso_medio_calculado,
          observacoes: 'Peso médio calculado'
        });
      }

      const { error } = await supabase
        .from('recebimentos_pallets')
        .insert(palletsToCreate);

      if (error) throw error;

      onPalletAdded();
      toast.success(`${recebimento.quantidade_pallets_informada} pallets criados com peso médio!`);
    } catch (error) {
      console.error('Erro ao criar pallets por média:', error);
      toast.error('Erro ao criar pallets por média');
    } finally {
      setLoading(false);
    }
  };

  // Auto-gerar pallets no modo média quando carregado pela primeira vez
  React.useEffect(() => {
    if (isModoMedia && pallets.length === 0 && recebimento?.quantidade_pallets_informada && recebimento?.peso_medio_calculado) {
      gerarPalletsMedia();
    }
  }, [isModoMedia, pallets.length, recebimento]);

  return (
    <div className="space-y-6">
      {/* Modo média - Informações */}
      {isModoMedia && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <Users className="h-5 w-5 mr-2" />
              Modo Pesagem por Média
            </CardTitle>
            <CardDescription className="text-blue-700">
              Pallets serão criados automaticamente com peso médio calculado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-sm text-gray-600">Quantidade</div>
                <div className="text-lg font-bold">{recebimento?.quantidade_pallets_informada} pallets</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-sm text-gray-600">Peso Total</div>
                <div className="text-lg font-bold">{recebimento?.peso_total_informado?.toFixed(1)} kg</div>
              </div>
              <div className="text-center p-3 bg-white rounded border">
                <div className="text-sm text-gray-600">Peso Médio</div>
                <div className="text-lg font-bold text-green-600">{recebimento?.peso_medio_calculado?.toFixed(1)} kg</div>
              </div>
            </div>
            {pallets.length === 0 && (
              <Button onClick={gerarPalletsMedia} disabled={loading} className="w-full">
                {loading ? 'Gerando...' : 'Gerar Pallets com Peso Médio'}
                <Plus className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formulário para adicionar pallet - apenas modo individual */}
      {!isModoMedia && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Scale className="h-5 w-5 mr-2" />
            Registrar Novo Pallet
          </CardTitle>
          <CardDescription>
            Registre o peso de cada pallet individualmente na ordem da pesagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={adicionarPallet} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg) *</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 25.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Input
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Pallet danificado"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Registrando...' : 'Registrar Pallet'}
                  <Plus className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Lista de pallets registrados */}
      <Card>
        <CardHeader>
          <CardTitle>Pallets Registrados</CardTitle>
          <CardDescription>
            Total de {pallets.length} pallets - Peso total: {pesoTotal.toFixed(1)} kg
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pallets.length > 0 ? (
            <div className="space-y-3">
              {pallets
                .sort((a, b) => a.ordem - b.ordem)
                .map((pallet) => (
                  <div key={pallet.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">
                        Pallet {pallet.ordem}
                      </Badge>
                      <div>
                        <span className="font-mono text-lg font-semibold">
                          {pallet.peso_kg.toFixed(1)} kg
                        </span>
                        {pallet.observacoes && (
                          <p className="text-sm text-gray-500">{pallet.observacoes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {new Date(pallet.registrado_em).toLocaleTimeString('pt-BR')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerPallet(pallet.id, pallet.ordem)}
                        className="text-red-600 hover:text-red-700"
                        disabled={pallets.length <= 2}
                        title={pallets.length <= 2 ? "Mínimo de 2 pallets necessário" : "Remover pallet"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Scale className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum pallet registrado ainda</p>
              <p className="text-sm">Comece registrando o peso do primeiro pallet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PesagemPallets;
