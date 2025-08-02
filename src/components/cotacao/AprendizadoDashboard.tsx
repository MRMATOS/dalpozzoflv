import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AprendizadoService } from '@/services/cotacao/aprendizadoService';
import { Brain, TrendingUp, Target, Lightbulb, BarChart3, CheckCircle } from 'lucide-react';

interface EstatisticasAprendizado {
  total_registros: number;
  feedback_positivo: number;
  feedback_negativo: number;
  padroes_identificados: number;
  fornecedores_treinados: number;
}

const AprendizadoDashboard: React.FC = () => {
  const [stats, setStats] = useState<EstatisticasAprendizado | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const estatisticas = await AprendizadoService.obterEstatisticas();
      setStats(estatisticas);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularTaxaSucesso = () => {
    if (!stats || stats.total_registros === 0) return 0;
    return Math.round((stats.feedback_positivo / stats.total_registros) * 100);
  };

  const getNivelAprendizado = () => {
    const taxa = calcularTaxaSucesso();
    if (taxa >= 80) return { nivel: 'Avançado', cor: 'text-green-600 bg-green-100' };
    if (taxa >= 60) return { nivel: 'Intermediário', cor: 'text-blue-600 bg-blue-100' };
    if (taxa >= 40) return { nivel: 'Básico', cor: 'text-yellow-600 bg-yellow-100' };
    return { nivel: 'Inicial', cor: 'text-red-600 bg-red-100' };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const nivelAprendizado = getNivelAprendizado();

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700">
          <Brain className="w-5 h-5" />
          Sistema de Aprendizado Automático
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status Geral */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div>
            <div className="text-sm text-muted-foreground">Nível do Sistema</div>
            <Badge className={nivelAprendizado.cor}>
              {nivelAprendizado.nivel}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">
              {calcularTaxaSucesso()}%
            </div>
            <div className="text-sm text-muted-foreground">Taxa de sucesso</div>
          </div>
        </div>

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Aprendizado</span>
            <span>{calcularTaxaSucesso()}%</span>
          </div>
          <Progress value={calcularTaxaSucesso()} className="h-2" />
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <TrendingUp className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-600">
              {stats.feedback_positivo}
            </div>
            <div className="text-xs text-muted-foreground">Feedbacks Positivos</div>
          </div>

          <div className="text-center p-3 bg-white rounded-lg border">
            <Target className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-blue-600">
              {stats.padroes_identificados}
            </div>
            <div className="text-xs text-muted-foreground">Padrões Identificados</div>
          </div>

          <div className="text-center p-3 bg-white rounded-lg border">
            <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-purple-600">
              {stats.fornecedores_treinados}
            </div>
            <div className="text-xs text-muted-foreground">Fornecedores Treinados</div>
          </div>

          <div className="text-center p-3 bg-white rounded-lg border">
            <BarChart3 className="w-6 h-6 text-orange-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-orange-600">
              {stats.total_registros}
            </div>
            <div className="text-xs text-muted-foreground">Total de Registros</div>
          </div>
        </div>

        {/* Ações Sugeridas */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="w-4 h-4 text-yellow-600" />
            Dicas para Melhorar o Aprendizado
          </div>
          
          <div className="space-y-2 text-sm">
            {stats.total_registros < 10 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                💡 Forneça mais feedback sobre as extrações para melhorar a precisão do sistema.
              </div>
            )}
            
            {calcularTaxaSucesso() < 70 && stats.feedback_negativo > 3 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                🎯 Corrija produtos extraídos incorretamente usando o botão de edição para treinar o sistema.
              </div>
            )}
            
            {stats.fornecedores_treinados < 3 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                🏢 Processe mensagens de mais fornecedores para expandir a base de conhecimento.
              </div>
            )}
            
            {calcularTaxaSucesso() >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                ✅ Excelente! O sistema está aprendendo bem. Continue fornecendo feedback para manter a qualidade.
              </div>
            )}
          </div>
        </div>

        {/* Ação */}
        <div className="flex justify-center pt-2">
          <Button 
            onClick={carregarEstatisticas}
            variant="outline" 
            size="sm"
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            Atualizar Estatísticas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AprendizadoDashboard;