import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { fallbackSystem, type QualityMetrics } from '@/services/cotacao/fallbackSystem';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface QualityIndicatorProps {
  visible?: boolean;
}

const QualityIndicator: React.FC<QualityIndicatorProps> = ({ visible = false }) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [metricas, setMetricas] = useState<QualityMetrics | null>(null);

  const atualizarMetricas = () => {
    const novasMetricas = fallbackSystem.getQualityMetrics();
    setMetricas(novasMetricas);
    setIsVisible(true);
  };

  const getQualityStatus = () => {
    if (!metricas || metricas.totalProdutos === 0) {
      return { status: 'neutral', color: 'bg-gray-500', text: 'Sem dados' };
    }

    const taxaIdentificacao = metricas.produtosIdentificados / metricas.totalProdutos;
    const confiancaMedia = metricas.mediaConfianca;

    if (taxaIdentificacao >= 0.8 && confiancaMedia >= 0.7) {
      return { status: 'excellent', color: 'bg-green-500', text: 'Excelente' };
    } else if (taxaIdentificacao >= 0.6 && confiancaMedia >= 0.5) {
      return { status: 'good', color: 'bg-blue-500', text: 'Bom' };
    } else if (taxaIdentificacao >= 0.4 && confiancaMedia >= 0.3) {
      return { status: 'warning', color: 'bg-yellow-500', text: 'Atenção' };
    } else {
      return { status: 'poor', color: 'bg-red-500', text: 'Baixo' };
    }
  };

  const getOrigemIcon = (origem: string) => {
    switch (origem) {
      case 'banco': return <CheckCircle className="h-4 w-4" />;
      case 'dicionario': return <BarChart3 className="h-4 w-4" />;
      case 'sinonimo': return <TrendingUp className="h-4 w-4" />;
      case 'manual': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getOrigemColor = (origem: string) => {
    switch (origem) {
      case 'banco': return 'bg-green-100 text-green-800';
      case 'dicionario': return 'bg-blue-100 text-blue-800';
      case 'sinonimo': return 'bg-orange-100 text-orange-800';
      case 'manual': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isVisible) {
    return (
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={atualizarMetricas}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Ver Métricas de Qualidade
        </Button>
      </div>
    );
  }

  if (!metricas || metricas.totalProdutos === 0) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Métricas de Qualidade
            </span>
            <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
              ✕
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Processe algumas mensagens para ver as métricas de qualidade.
          </p>
        </CardContent>
      </Card>
    );
  }

  const qualityStatus = getQualityStatus();
  const taxaIdentificacao = Math.round((metricas.produtosIdentificados / metricas.totalProdutos) * 100);
  const taxaPreco = Math.round((metricas.produtosComPreco / metricas.totalProdutos) * 100);
  const confiancaMedia = Math.round(metricas.mediaConfianca * 100);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Métricas de Qualidade
            <Badge className={`${qualityStatus.color} text-white`}>
              {qualityStatus.text}
            </Badge>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            ✕
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas Principais */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Produtos Processados</div>
            <div className="text-xl font-bold">{metricas.totalProdutos}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Confiança Média</div>
            <div className="text-xl font-bold">{confiancaMedia}%</div>
          </div>
        </div>

        {/* Barras de Progresso */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Taxa de Identificação</span>
              <span>{taxaIdentificacao}%</span>
            </div>
            <Progress value={taxaIdentificacao} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Produtos com Preço</span>
              <span>{taxaPreco}%</span>
            </div>
            <Progress value={taxaPreco} className="h-2" />
          </div>
        </div>

        {/* Distribuição por Origem */}
        <div>
          <div className="text-sm font-medium mb-2">Distribuição por Origem</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metricas.origemDistribuicao).map(([origem, count]) => {
              const porcentagem = Math.round((count / metricas.totalProdutos) * 100);
              return (
                <Badge 
                  key={origem}
                  variant="secondary"
                  className={`${getOrigemColor(origem)} flex items-center gap-1`}
                >
                  {getOrigemIcon(origem)}
                  {origem}: {count} ({porcentagem}%)
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={atualizarMetricas}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityIndicator;