
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProductDependencies {
  has_estoque: boolean;
  has_requisicoes: boolean;
  has_cotacoes: boolean;
  estoque_total: number;
  message: string;
}

interface ProductDeletionHandlerProps {
  produtoId: string;
  produtoNome: string;
  onDeleteSuccess: () => void;
  onCancel: () => void;
}

const ProductDeletionHandler: React.FC<ProductDeletionHandlerProps> = ({
  produtoId,
  produtoNome,
  onDeleteSuccess,
  onCancel
}) => {
  const [dependencies, setDependencies] = useState<ProductDependencies | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const checkDependencies = async () => {
    try {
      setIsChecking(true);
      console.log('Verificando dependências para produto:', produtoId);

      const { data, error } = await supabase.rpc('check_produto_dependencies', {
        produto_uuid: produtoId
      });

      if (error) {
        console.error('Erro ao verificar dependências:', error);
        toast.error('Erro ao verificar dependências do produto');
        return;
      }

      const deps = data?.[0] as ProductDependencies;
      console.log('Dependências encontradas:', deps);
      setDependencies(deps);

      if (!deps.has_estoque && !deps.has_requisicoes && !deps.has_cotacoes) {
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Erro ao verificar dependências:', error);
      toast.error('Erro interno ao verificar dependências');
    } finally {
      setIsChecking(false);
    }
  };

  const clearEstoqueAndDelete = async () => {
    try {
      setIsDeleting(true);
      console.log('Limpando estoque e excluindo produto:', produtoId);

      // Primeiro limpar o estoque
      const { error: clearError } = await supabase.rpc('clear_produto_estoque', {
        produto_uuid: produtoId
      });

      if (clearError) {
        console.error('Erro ao limpar estoque:', clearError);
        toast.error('Erro ao limpar estoque do produto');
        return;
      }

      // Depois excluir o produto
      await deleteProduto();
    } catch (error) {
      console.error('Erro ao limpar estoque e excluir:', error);
      toast.error('Erro interno durante a exclusão');
      setIsDeleting(false);
    }
  };

  const deleteProduto = async () => {
    try {
      if (!isDeleting) {
        setIsDeleting(true);
      }

      console.log('Excluindo produto:', produtoId);

      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produtoId);

      if (error) {
        console.error('Erro ao excluir produto:', error);
        // Se houver erro de foreign key constraint, tentar exclusão forçada
        if (error.message.includes('foreign key constraint') || error.message.includes('violates foreign key')) {
          await forceDeleteProduto();
          return;
        }
        toast.error(`Erro ao excluir produto: ${error.message}`);
        return;
      }

      toast.success(`Produto "${produtoNome}" excluído com sucesso!`);
      onDeleteSuccess();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro interno ao excluir produto');
    } finally {
      setIsDeleting(false);
    }
  };

  const forceDeleteProduto = async () => {
    try {
      console.log('Tentando exclusão forçada do produto:', produtoId);

      const { data, error } = await supabase.rpc('force_delete_produto', {
        produto_uuid: produtoId
      });

      if (error) {
        console.error('Erro na exclusão forçada:', error);
        toast.error(`Erro ao excluir produto: ${error.message}`);
        return;
      }

      if (!data) {
        toast.error('Você não tem permissão para exclusão forçada');
        return;
      }

      toast.success(`Produto "${produtoNome}" e suas dependências foram excluídos!`);
      onDeleteSuccess();
    } catch (error) {
      console.error('Erro na exclusão forçada:', error);
      toast.error('Erro interno durante a exclusão forçada');
    }
  };

  React.useEffect(() => {
    checkDependencies();
  }, [produtoId]);

  if (isChecking) {
    return (
      <div className="p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-600">Verificando dependências...</p>
      </div>
    );
  }

  if (!dependencies) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-600">Erro ao carregar informações do produto</p>
        <Button variant="outline" onClick={onCancel} className="mt-2">
          Cancelar
        </Button>
      </div>
    );
  }

  const hasDependencies = dependencies.has_estoque || dependencies.has_requisicoes || dependencies.has_cotacoes;

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">
          Excluir produto "{produtoNome}"?
        </h3>
      </div>

      <Alert variant={hasDependencies ? "destructive" : "default"}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {dependencies.message}
          {dependencies.has_estoque && (
            <div className="mt-1 text-sm">
              <strong>Estoque total:</strong> {dependencies.estoque_total} unidades
            </div>
          )}
        </AlertDescription>
      </Alert>

      {hasDependencies && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Opções disponíveis:</p>
          
          {dependencies.has_estoque && (
            <Button
              variant="outline"
              onClick={clearEstoqueAndDelete}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Limpando estoque e excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar estoque e excluir produto
                </>
              )}
            </Button>
          )}

          {(dependencies.has_requisicoes || dependencies.has_cotacoes) && (
            <Alert>
              <AlertDescription className="text-sm">
                ⚠️ Este produto possui histórico de requisições ou cotações. 
                A exclusão pode afetar relatórios históricos.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {(showConfirmation || !hasDependencies) && (
        <div className="space-y-2">
          <Button
            variant="destructive"
            onClick={deleteProduto}
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
        </div>
      )}

      <div className="flex space-x-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default ProductDeletionHandler;
