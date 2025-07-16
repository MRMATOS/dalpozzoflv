
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from 'sonner';
import TipoCaixaModal from './TipoCaixaModal';

interface TipoCaixaSelectorProps {
  tiposCaixa: any[];
  value: string;
  onValueChange: (value: string) => void;
  onTiposUpdated: () => void;
}

const TipoCaixaSelector: React.FC<TipoCaixaSelectorProps> = ({
  tiposCaixa,
  value,
  onValueChange,
  onTiposUpdated
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoParaEditar, setTipoParaEditar] = useState<any>(null);

  const excluirTipo = async (tipoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Tem certeza que deseja excluir este tipo de caixa?')) return;

    try {
      const { error } = await supabase
        .from('tipos_caixas')
        .update({ ativo: false })
        .eq('id', tipoId);

      if (error) throw error;

      if (value === tipoId) {
        onValueChange('');
      }

      onTiposUpdated();
      toast.success('Tipo de caixa removido');
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
      toast.error('Erro ao remover tipo de caixa');
    }
  };

  const editarTipo = (tipo: any, event: React.MouseEvent) => {
    event.stopPropagation();
    setTipoParaEditar(tipo);
    setModalAberto(true);
  };

  const handleTipoCaixaAdded = (novoTipo: any) => {
    onTiposUpdated();
    onValueChange(novoTipo.id);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setTipoParaEditar(null);
  };

  const handleNovaClick = () => {
    setTipoParaEditar(null);
    setModalAberto(true);
  };

  const handleValueChange = (newValue: string) => {
    if (newValue === 'nova-caixa') {
      handleNovaClick();
      return;
    }
    if (newValue === 'sem-caixa') {
      onValueChange('sem-caixa');
      return;
    }
    onValueChange(newValue);
  };

  return (
    <>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sem-caixa" className="text-blue-600 font-medium">
            <div className="flex items-center">
              <span>Sem Caixa (Tara: 0 kg)</span>
            </div>
          </SelectItem>
          {tiposCaixa?.map((tipo) => (
            <SelectItem key={tipo.id} value={tipo.id}>
              <div className="flex items-center justify-between w-full">
                <span className="flex-1">{tipo.nome} ({tipo.tara_kg} kg)</span>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-blue-100"
                    onClick={(e) => editarTipo(tipo, e)}
                  >
                    <Edit className="h-3 w-3 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100"
                    onClick={(e) => excluirTipo(tipo.id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              </div>
            </SelectItem>
          ))}
          <SelectItem value="nova-caixa" className="text-green-600 font-medium">
            <div className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Nova Caixa
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <TipoCaixaModal
        isOpen={modalAberto}
        onClose={handleFecharModal}
        onTipoCaixaAdded={handleTipoCaixaAdded}
        tipoParaEditar={tipoParaEditar}
      />
    </>
  );
};

export default TipoCaixaSelector;
