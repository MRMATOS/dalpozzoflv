import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface IndicadorConfiancaProps {
  confianca?: number;
  origem?: 'dicionario' | 'sinonimo' | 'banco' | 'manual';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const IndicadorConfianca: React.FC<IndicadorConfiancaProps> = ({
  confianca,
  origem,
  size = 'md',
  showLabel = true
}) => {
  const getConfiancaInfo = () => {
    if (!confianca) {
      return {
        level: 'unknown',
        color: 'secondary',
        icon: Info,
        label: 'N/A',
        description: 'Confiança não disponível'
      };
    }

    if (confianca >= 0.9) {
      return {
        level: 'high',
        color: 'default',
        icon: CheckCircle,
        label: 'Alta',
        description: 'Identificação com alta confiança (≥90%)'
      };
    } else if (confianca >= 0.7) {
      return {
        level: 'medium',
        color: 'secondary',
        icon: Shield,
        label: 'Média',
        description: 'Identificação com confiança média (70-89%)'
      };
    } else {
      return {
        level: 'low',
        color: 'destructive',
        icon: AlertTriangle,
        label: 'Baixa',
        description: 'Identificação com baixa confiança (<70%)'
      };
    }
  };

  const getOrigemInfo = () => {
    const origemMap = {
      manual: { label: 'Manual', description: 'Adicionado manualmente pelo usuário' },
      banco: { label: 'Banco', description: 'Identificado via busca no banco de dados' },
      dicionario: { label: 'Dicionário', description: 'Encontrado no dicionário de produtos' },
      sinonimo: { label: 'Sinônimo', description: 'Identificado via sinônimos cadastrados' }
    };
    
    return origem ? origemMap[origem] : { label: 'Desconhecida', description: 'Origem não identificada' };
  };

  const confiancaInfo = getConfiancaInfo();
  const origemInfo = getOrigemInfo();
  const IconComponent = confiancaInfo.icon;

  const sizeClasses = {
    sm: 'text-xs h-4',
    md: 'text-sm h-5',
    lg: 'text-base h-6'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Badge 
              variant={confiancaInfo.color as any}
              className={`${sizeClasses[size]} flex items-center gap-1`}
            >
              <IconComponent className={iconSizes[size]} />
              {showLabel && (
                <span>
                  {confianca ? `${(confianca * 100).toFixed(0)}%` : confiancaInfo.label}
                </span>
              )}
            </Badge>
            {origem && (
              <Badge variant="outline" className={`${sizeClasses[size]}`}>
                {origemInfo.label}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <div className="font-semibold">
              Confiança: {confiancaInfo.label}
              {confianca && ` (${(confianca * 100).toFixed(1)}%)`}
            </div>
            <div className="text-xs text-gray-600">
              {confiancaInfo.description}
            </div>
            {origem && (
              <>
                <div className="font-semibold mt-2">
                  Origem: {origemInfo.label}
                </div>
                <div className="text-xs text-gray-600">
                  {origemInfo.description}
                </div>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default IndicadorConfianca;