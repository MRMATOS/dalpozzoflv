import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, Database, Book, Brain } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface StatusIntegracaoProps {
  produto: ProdutoExtraido;
  size?: 'sm' | 'md';
}

export function StatusIntegracao({ produto, size = 'md' }: StatusIntegracaoProps) {
  const getStatusInfo = () => {
    if (produto.produtoId) {
      return {
        icon: <Database className={`h-${size === 'sm' ? '3' : '4'} w-${size === 'sm' ? '3' : '4'} text-green-600`} />,
        label: 'Integrado',
        description: 'Produto encontrado no banco de dados',
        variant: 'success' as const,
        confidence: Math.round((produto.confianca || 0) * 100)
      };
    }

    if (produto.origem === 'dicionario') {
      return {
        icon: <Book className={`h-${size === 'sm' ? '3' : '4'} w-${size === 'sm' ? '3' : '4'} text-blue-600`} />,
        label: 'Dicionário',
        description: 'Identificado pelo dicionário de produtos',
        variant: 'secondary' as const,
        confidence: Math.round((produto.confianca || 0) * 100)
      };
    }

    if (produto.origem === 'banco') {
      return {
        icon: <Brain className={`h-${size === 'sm' ? '3' : '4'} w-${size === 'sm' ? '3' : '4'} text-purple-600`} />,
        label: 'Aprendizado',
        description: 'Identificado por aprendizado anterior',
        variant: 'secondary' as const,
        confidence: Math.round((produto.confianca || 0) * 100)
      };
    }

    return {
      icon: <AlertCircle className={`h-${size === 'sm' ? '3' : '4'} w-${size === 'sm' ? '3' : '4'} text-yellow-600`} />,
      label: 'Pendente',
      description: 'Produto não identificado automaticamente',
      variant: 'outline' as const,
      confidence: Math.round((produto.confianca || 0) * 100)
    };
  };

  const status = getStatusInfo();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {status.icon}
            <Badge variant={status.variant} className={size === 'sm' ? 'text-xs px-2 py-1' : ''}>
              {status.label}
            </Badge>
            {size === 'md' && (
              <Badge variant="outline" className="text-xs">
                {status.confidence}%
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{status.description}</p>
            <p className="text-xs text-muted-foreground">
              Confiança: {status.confidence}%
            </p>
            {produto.produtoId && (
              <p className="text-xs text-muted-foreground">
                ID: {produto.produtoId}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}