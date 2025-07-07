
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Package, Plus, Scale, Users } from "lucide-react";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const NovoRecebimento = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fornecedor: '',
    origem: '',
    observacoes: '',
    modo_pesagem: 'individual',
    quantidade_pallets: '',
    peso_total: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    // Validações para modo média
    if (formData.modo_pesagem === 'media') {
      if (!formData.quantidade_pallets || !formData.peso_total) {
        toast.error('Preencha quantidade de pallets e peso total para o modo média');
        return;
      }
      
      const quantidade = parseInt(formData.quantidade_pallets);
      if (quantidade < 2) {
        toast.error('A pesagem por média exige pelo menos 2 pallets');
        return;
      }
    }

    setLoading(true);
    try {
      const pesoMedio = formData.modo_pesagem === 'media' 
        ? parseFloat(formData.peso_total) / parseInt(formData.quantidade_pallets)
        : null;

      const { data, error } = await supabase
        .from('recebimentos')
        .insert({
          fornecedor: formData.fornecedor || null,
          origem: formData.origem || null,
          observacoes: formData.observacoes || null,
          iniciado_por: profile.id,
          status: 'iniciado',
          modo_pesagem: formData.modo_pesagem,
          quantidade_pallets_informada: formData.modo_pesagem === 'media' ? parseInt(formData.quantidade_pallets) : null,
          peso_total_informado: formData.modo_pesagem === 'media' ? parseFloat(formData.peso_total) : null,
          peso_medio_calculado: pesoMedio
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
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Novo Recebimento</h1>
                <p className="text-sm text-gray-500">Iniciar processo de recebimento físico</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Informações do Recebimento
            </CardTitle>
            <CardDescription>
              Preencha as informações básicas para iniciar o recebimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fornecedor">Fornecedor (opcional)</Label>
                <Input
                  id="fornecedor"
                  value={formData.fornecedor}
                  onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                  placeholder="Nome do fornecedor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origem">Origem (opcional)</Label>
                <Input
                  id="origem"
                  value={formData.origem}
                  onChange={(e) => setFormData(prev => ({ ...prev, origem: e.target.value }))}
                  placeholder="Local de origem da mercadoria"
                />
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações (opcional)</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações sobre o recebimento"
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/recebimento')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
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
