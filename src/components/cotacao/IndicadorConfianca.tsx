import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, HelpCircle, Database } from 'lucide-react';

interface IndicadorConfiancaProps {
  origem: 'dicionario' | 'sinonimo' | 'banco' | 'manual';
  confianca?: number;
  size?: 'sm' | 'md' | 'lg';
}

const IndicadorConfianca: React.FC<IndicadorConfiancaProps> = ({
  origem,
  confianca = 0.5,
  size = 'sm'
}) => {
  const getIndicadorProps = () => {
    switch (origem) {
      case 'banco':
        return {
          variant: 'default' as const,
          icon: Database,
          label: 'Banco de dados',
          description: `Produto identificado no banco com ${Math.round(confianca * 100)}% de confiança`,
          color: 'text-green-600'
        };
      case 'dicionario':
        return {
          variant: 'secondary' as const,
          icon: CheckCircle,
          label: 'Dicionário',
          description: 'Produto identificado pelo dicionário interno',
          color: 'text-blue-600'
        };
      case 'sinonimo':
        return {
          variant: 'outline' as const,
          icon: AlertCircle,
          label: 'Sinônimo',
          description: `Produto identificado por sinônimo com ${Math.round(confianca * 100)}% de confiança`,
          color: 'text-orange-600'
        };
      case 'manual':
        return {
          variant: 'destructive' as const,
          icon: HelpCircle,
          label: 'Manual',
          description: 'Produto não identificado automaticamente - requer revisão',
          color: 'text-red-600'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: HelpCircle,
          label: 'Desconhecido',
          description: 'Origem da identificação não especificada',
          color: 'text-gray-600'
        };
    }
  };

  const { variant, icon: Icon, label, description, color } = getIndicadorProps();
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const badgeSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={`inline-flex items-center gap-1 ${badgeSize}`}>
            <Icon className={`${sizeClasses[size]} ${color}`} />
            {size !== 'sm' && <span>{label}</span>}
            {confianca && confianca < 1 && (
              <span className="ml-1 text-xs opacity-75">
                {Math.round(confianca * 100)}%
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <p className="font-medium">{label}</p>
            <p className="text-sm opacity-90">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default IndicadorConfianca;