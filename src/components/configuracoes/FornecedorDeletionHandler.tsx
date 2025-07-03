import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FornecedorDeletionHandlerProps {
  fornecedorId: string;
  fornecedorNome: string;
  onDeleteSuccess: () => void;
  onCancel: () => void;
}

const FornecedorDeletionHandler: React.FC<FornecedorDeletionHandlerProps> = ({
  fornecedorId,
  fornecedorNome,
  onDeleteSuccess,
  onCancel
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showForceConfirmation, setShowForceConfirmation] = useState(false);

  const tryNormalDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Tentando exclusão normal do fornecedor:', fornecedorId);

      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', fornecedorId);

      if (error) {
        console.error('Erro na exclusão normal:', error);
        // Se houver erro de foreign key constraint, oferece exclusão forçada
        if (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key')) {
          setShowForceConfirmation(true);
          setIsDeleting(false);
          return;
        }
        toast.error(`Erro ao excluir fornecedor: ${error.message}`);
        setIsDeleting(false);
        return;
      }

      toast.success(`Fornecedor "${fornecedorNome}" excluído com sucesso!`);
      onDeleteSuccess();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error('Erro interno ao excluir fornecedor');
      setIsDeleting(false);
    }
  };

  const forceDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Executando exclusão forçada do fornecedor:', fornecedorId);

      const { data, error } = await supabase.rpc('force_delete_fornecedor', {
        fornecedor_uuid: fornecedorId
      });

      if (error) {
        console.error('Erro na exclusão forçada:', error);
        toast.error(`Erro ao excluir fornecedor: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error('Você não tem permissão para exclusão forçada');
        return;
      }

      toast.success(`Fornecedor "${fornecedorNome}" e suas dependências foram excluídos!`);
      onDeleteSuccess();
    } catch (error) {
      console.error('Erro na exclusão forçada:', error);
      toast.error('Erro interno durante a exclusão forçada');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">
          Excluir fornecedor "{fornecedorNome}"?
        </h3>
      </div>

      {!showForceConfirmation ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Esta ação irá excluir permanentemente o fornecedor do sistema.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Fornecedor possui dependências!</strong>
            <br />
            Este fornecedor está sendo usado em pedidos ou cotações.
            <br />
            <br />
            Como usuário master, você pode forçar a exclusão, que irá:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Excluir todos os pedidos de compra deste fornecedor</li>
              <li>Excluir todas as cotações deste fornecedor</li>
              <li>Excluir o fornecedor permanentemente</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {!showForceConfirmation ? (
          <Button
            variant="destructive"
            onClick={tryNormalDelete}
            disabled={isDeleting}
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar exclusão
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={forceDelete}
            disabled={isDeleting}
            className="w-full"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Forçando exclusão...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Forçar exclusão (Master)
              </>
            )}
          </Button>
        )}

        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default FornecedorDeletionHandler;