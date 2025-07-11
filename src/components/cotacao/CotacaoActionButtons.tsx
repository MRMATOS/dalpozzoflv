
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, FileText, RotateCcw, Save, Plus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CotacaoActionButtonsProps {
  onSalvarRascunho: () => Promise<boolean>;
  onRestaurarCotacao: () => void;
  onNovaCotacao: () => void;
  onVerResumo: () => void;
  onAdicionarProduto: () => void;
  temDados: boolean;
}

const CotacaoActionButtons: React.FC<CotacaoActionButtonsProps> = ({
  onSalvarRascunho,
  onRestaurarCotacao,
  onNovaCotacao,
  onVerResumo,
  onAdicionarProduto,
  temDados
}) => {
  const handleSalvarClick = async () => {
    await onSalvarRascunho();
  };

  return (
    <div className="flex items-center space-x-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSalvarClick}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Salvar rascunho</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onRestaurarCotacao}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Restaurar último rascunho</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onNovaCotacao}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Nova cotação (limpar tudo)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onAdicionarProduto}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Adicionar produto manualmente</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button onClick={onVerResumo} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Ver Resumo
      </Button>
    </div>
  );
};

export default CotacaoActionButtons;
