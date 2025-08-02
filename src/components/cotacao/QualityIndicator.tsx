import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface QualityMetrics {
  totalExtractions: number;
  successRate: number;
  averageConfidence: number;
  improvedProducts: number;
  supplierAccuracy: { [supplier: string]: number };
}

interface QualityIndicatorProps {
  metrics: QualityMetrics;
  supplier?: string;
  compact?: boolean;
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({
  metrics,
  supplier,
  compact = false
}) => {
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'default';
    if (rate >= 70) return 'secondary';
    return 'destructive';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (current: number, baseline: number = 75) => {
    if (current > baseline + 5) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (current < baseline - 5) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const supplierRate = supplier ? metrics.supplierAccuracy[supplier] || 0 : 0;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Badge variant={getSuccessRateColor(metrics.successRate)} className="text-xs">
                {metrics.successRate.toFixed(0)}%
              </Badge>
              {getTrendIcon(metrics.successRate)}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <div className="font-semibold">Qualidade da Extração</div>
              <div className="text-xs">
                Taxa de sucesso: {metrics.successRate.toFixed(1)}%
              </div>
              <div className="text-xs">
                Confiança média: {(metrics.averageConfidence * 100).toFixed(1)}%
              </div>
              <div className="text-xs">
                Total de extrações: {metrics.totalExtractions}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold">Indicadores de Qualidade</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Taxa de Sucesso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Taxa de Sucesso</span>
            <div className="flex items-center gap-1">
              <Badge variant={getSuccessRateColor(metrics.successRate)}>
                {metrics.successRate.toFixed(1)}%
              </Badge>
              {getTrendIcon(metrics.successRate)}
            </div>
          </div>
          <Progress value={metrics.successRate} className="h-2" />
          <div className="text-xs text-gray-500">
            {metrics.totalExtractions} extrações processadas
          </div>
        </div>

        {/* Confiança Média */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confiança Média</span>
            <Badge variant={getConfidenceColor(metrics.averageConfidence)}>
              {(metrics.averageConfidence * 100).toFixed(1)}%
            </Badge>
          </div>
          <Progress value={metrics.averageConfidence * 100} className="h-2" />
          <div className="text-xs text-gray-500">
            {metrics.improvedProducts} produtos aprimorados
          </div>
        </div>

        {/* Precisão por Fornecedor (se especificado) */}
        {supplier && (
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Precisão - {supplier}</span>
              <Badge variant={getSuccessRateColor(supplierRate)}>
                {supplierRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={supplierRate} className="h-2" />
            <div className="text-xs text-gray-500">
              Baseado no histórico de extrações deste fornecedor
            </div>
          </div>
        )}
      </div>

      {/* Top Fornecedores */}
      <div className="space-y-2">
        <span className="text-sm font-medium">Precisão por Fornecedor</span>
        <div className="space-y-1">
          {Object.entries(metrics.supplierAccuracy)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([supplierName, accuracy]) => (
              <div key={supplierName} className="flex items-center justify-between text-xs">
                <span className="truncate flex-1">{supplierName}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full" 
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <span className="w-10 text-right">{accuracy.toFixed(0)}%</span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default QualityIndicator;