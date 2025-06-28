
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface TipoCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTipoCaixaAdded: (novoTipo: any) => void;
  tipoParaEditar?: any;
}

const TipoCaixaModal: React.FC<TipoCaixaModalProps> = ({
  isOpen,
  onClose,
  onTipoCaixaAdded,
  tipoParaEditar
}) => {
  const [formData, setFormData] = useState({
    nome: tipoParaEditar?.nome || '',
    tara_kg: tipoParaEditar?.tara_kg?.toString() || '',
    descricao: tipoParaEditar?.descricao || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.tara_kg) {
      toast.error('Preencha nome e peso da caixa');
      return;
    }

    setLoading(true);
    try {
      if (tipoParaEditar) {
        // Editar tipo existente
        const { data, error } = await supabase
          .from('tipos_caixas')
          .update({
            nome: formData.nome,
            tara_kg: parseFloat(formData.tara_kg),
            descricao: formData.descricao || null
          })
          .eq('id', tipoParaEditar.id)
          .select()
          .single();

        if (error) throw error;
        
        onTipoCaixaAdded(data);
        toast.success('Tipo de caixa atualizado!');
      } else {
        // Criar novo tipo
        const { data, error } = await supabase
          .from('tipos_caixas')
          .insert({
            nome: formData.nome,
            tara_kg: parseFloat(formData.tara_kg),
            descricao: formData.descricao || null
          })
          .select()
          .single();

        if (error) throw error;
        
        onTipoCaixaAdded(data);
        toast.success('Novo tipo de caixa criado!');
      }

      setFormData({ nome: '', tara_kg: '', descricao: '' });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tipo de caixa:', error);
      toast.error('Erro ao salvar tipo de caixa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {tipoParaEditar ? 'Editar Tipo de Caixa' : 'Nova Caixa'}
          </DialogTitle>
          <DialogDescription>
            {tipoParaEditar ? 'Edite as informações do tipo de caixa' : 'Adicione um novo tipo de caixa com seu peso padrão'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Caixa *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Caixa Plástica Média"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tara_kg">Peso da Caixa (kg) *</Label>
            <Input
              id="tara_kg"
              type="number"
              step="0.1"
              value={formData.tara_kg}
              onChange={(e) => setFormData(prev => ({ ...prev, tara_kg: e.target.value }))}
              placeholder="Ex: 2.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição adicional"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : tipoParaEditar ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TipoCaixaModal;
