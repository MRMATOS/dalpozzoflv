import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
interface CancelRecebimentoButtonProps {
  recebimentoId: string;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  onCancel?: () => void;
}
const CancelRecebimentoButton: React.FC<CancelRecebimentoButtonProps> = ({
  recebimentoId,
  variant = 'destructive',
  size = 'sm',
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const cancelarRecebimento = async () => {
    if (!confirm('Tem certeza que deseja cancelar este recebimento? Todas as informações serão perdidas.')) {
      return;
    }
    setLoading(true);
    try {
      // Excluir produtos do recebimento
      const {
        error: errorProdutos
      } = await supabase.from('recebimentos_produtos').delete().eq('recebimento_id', recebimentoId);
      if (errorProdutos) throw errorProdutos;

      // Excluir pallets do recebimento
      const {
        error: errorPallets
      } = await supabase.from('recebimentos_pallets').delete().eq('recebimento_id', recebimentoId);
      if (errorPallets) throw errorPallets;

      // Excluir o recebimento
      const {
        error: errorRecebimento
      } = await supabase.from('recebimentos').delete().eq('id', recebimentoId);
      if (errorRecebimento) throw errorRecebimento;
      toast.success('Recebimento cancelado com sucesso!');
      if (onCancel) {
        onCancel();
      } else {
        navigate('/recebimento');
      }
    } catch (error) {
      console.error('Erro ao cancelar recebimento:', error);
      toast.error('Erro ao cancelar recebimento');
    } finally {
      setLoading(false);
    }
  };
  return <Button variant={variant} size={size} onClick={cancelarRecebimento} disabled={loading} className="border-red-200 hover:border-red-300 text-red-50">
      {loading ? 'Cancelando...' : 'Cancelar'}
      <Trash2 className="h-4 w-4 ml-1" />
    </Button>;
};
export default CancelRecebimentoButton;