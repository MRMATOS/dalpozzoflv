import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from 'sonner';
import TipoCaixaModal from './TipoCaixaModal';

interface TiposCaixasRecebimentoProps {
  onTipoSelected?: (tipo: any) => void;
}

const TiposCaixasRecebimento: React.FC<TiposCaixasRecebimentoProps> = ({ onTipoSelected }) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoParaEditar, setTipoParaEditar] = useState<any>(null);

  const { data: tiposCaixas, refetch } = useQuery({
    queryKey: ['tipos-caixas-recebimento'],
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

  const excluirTipo = async (tipoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de caixa?')) return;

    try {
      const { error } = await supabase
        .from('tipos_caixas')
        .update({ ativo: false })
        .eq('id', tipoId);

      if (error) throw error;

      refetch();
      toast.success('Tipo de caixa removido com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
      toast.error('Erro ao remover tipo de caixa');
    }
  };

  const editarTipo = (tipo: any) => {
    setTipoParaEditar(tipo);
    setModalAberto(true);
  };

  const handleNovoTipo = () => {
    setTipoParaEditar(null);
    setModalAberto(true);
  };

  const handleTipoCaixaAdded = () => {
    refetch();
    setModalAberto(false);
    setTipoParaEditar(null);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setTipoParaEditar(null);
  };

  const handleSelecionarTipo = (tipo: any) => {
    if (onTipoSelected) {
      onTipoSelected(tipo);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-lg">
                <Package className="h-5 w-5 mr-2" />
                Gerenciar Tipos de Caixas
              </CardTitle>
              <CardDescription>
                Configure os tipos de caixas disponíveis para os recebimentos
              </CardDescription>
            </div>
            <Button onClick={handleNovoTipo} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {tiposCaixas && tiposCaixas.length > 0 ? (
            <div className="space-y-3">
              {tiposCaixas.map((tipo) => (
                <div key={tipo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-gray-900">{tipo.nome}</h4>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                        {tipo.tara_kg} kg
                      </Badge>
                    </div>
                    {tipo.descricao && (
                      <p className="text-sm text-gray-500 mt-1">{tipo.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {onTipoSelected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelecionarTipo(tipo)}
                        className="hover:bg-green-50 text-green-600 border-green-200"
                      >
                        Usar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editarTipo(tipo)}
                      className="hover:bg-blue-50 text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluirTipo(tipo.id)}
                      className="hover:bg-red-50 text-red-600 border-red-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum tipo de caixa cadastrado</p>
              <Button onClick={handleNovoTipo} size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Tipo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TipoCaixaModal
        isOpen={modalAberto}
        onClose={handleFecharModal}
        onTipoCaixaAdded={handleTipoCaixaAdded}
        tipoParaEditar={tipoParaEditar}
      />
    </>
  );
};

export default TiposCaixasRecebimento;