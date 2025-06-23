
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock, FileText } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CotacaoActionButtonsProps {
  onRestaurarCotacao: () => void;
  onNovaCotacao: () => void;
  onVerResumo: () => void;
  temDados: boolean;
}

const CotacaoActionButtons: React.FC<CotacaoActionButtonsProps> = ({
  onRestaurarCotacao,
  onNovaCotacao,
  onVerResumo,
  temDados
}) => {
  return (
    <div className="flex items-center space-x-3">
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
            <p>Restaurar última cotação</p>
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
