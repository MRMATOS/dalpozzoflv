import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Cache simples com TTL
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 60000) { // 1 minuto por padrão
    this.ttl = ttlMs;
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear() {
    this.cache.clear();
  }
}

const statsCache = new SimpleCache(30000); // 30 segundos

const AprendizadoDashboardOptimizado: React.FC = React.memo(() => {
  const [stats, setStats] = useState<EstatisticasAprendizado | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Debounce para evitar múltiplas chamadas
  const carregarEstatisticas = useCallback(async () => {
    const now = Date.now();
    if (now - lastUpdate < 5000) return; // Evitar chamadas frequentes (5s)
    
    // Verificar cache primeiro
    const cached = statsCache.get('stats');
    if (cached) {
      setStats(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const estatisticas = await AprendizadoService.obterEstatisticas();
      setStats(estatisticas);
      setLastUpdate(now);
      
      // Salvar no cache
      statsCache.set('stats', estatisticas);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  }, [lastUpdate]);

  // Carregar apenas no mount
  useEffect(() => {
    carregarEstatisticas();
  }, []); // Dependências vazias para carregar apenas uma vez

  const calcularTaxaSucesso = useCallback(() => {
    if (!stats || stats.total_registros === 0) return 0;
    return Math.round((stats.feedback_positivo / stats.total_registros) * 100);
  }, [stats]);

  const nivelAprendizado = useMemo(() => {
    const taxa = calcularTaxaSucesso();
    if (taxa >= 80) return { nivel: 'Avançado', cor: 'text-green-600 bg-green-100' };
    if (taxa >= 60) return { nivel: 'Intermediário', cor: 'text-blue-600 bg-blue-100' };
    if (taxa >= 40) return { nivel: 'Básico', cor: 'text-yellow-600 bg-yellow-100' };
    return { nivel: 'Inicial', cor: 'text-red-600 bg-red-100' };
  }, [calcularTaxaSucesso]);

  const dicas = useMemo(() => {
    if (!stats) return [];
    
    const dicasArray = [];
    const taxaSucesso = calcularTaxaSucesso();
    
    if (stats.total_registros < 10) {
      dicasArray.push({
        tipo: 'warning',
        texto: '💡 Forneça mais feedback sobre as extrações para melhorar a precisão do sistema.'
      });
    }
    
    if (taxaSucesso < 70 && stats.feedback_negativo > 3) {
      dicasArray.push({
        tipo: 'info',
        texto: '🎯 Corrija produtos extraídos incorretamente usando o botão de edição para treinar o sistema.'
      });
    }
    
    if (stats.fornecedores_treinados < 3) {
      dicasArray.push({
        tipo: 'purple',
        texto: '🏢 Processe mensagens de mais fornecedores para expandir a base de conhecimento.'
      });
    }
    
    if (taxaSucesso >= 80) {
      dicasArray.push({
        tipo: 'success',
        texto: '✅ Excelente! O sistema está aprendendo bem. Continue fornecendo feedback para manter a qualidade.'
      });
    }
    
    return dicasArray;
  }, [stats, calcularTaxaSucesso]);

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
        {dicas.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              Dicas para Melhorar o Aprendizado
            </div>
            
            <div className="space-y-2 text-sm">
              {dicas.map((dica, index) => (
                <div key={index} className={`p-3 rounded-lg border ${
                  dica.tipo === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  dica.tipo === 'info' ? 'bg-blue-50 border-blue-200' :
                  dica.tipo === 'purple' ? 'bg-purple-50 border-purple-200' :
                  'bg-green-50 border-green-200'
                }`}>
                  {dica.texto}
                </div>
              ))}
            </div>
          </div>
        )}

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
});

AprendizadoDashboardOptimizado.displayName = 'AprendizadoDashboardOptimizado';

export default AprendizadoDashboardOptimizado;