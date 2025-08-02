import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Package,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { AprendizadoService } from '@/services/cotacao/aprendizadoService';
import { toast } from 'sonner';
import QualityIndicator from './QualityIndicator';

interface DashboardStats {
  totalAprendizados: number;
  feedbackPositivo: number;
  feedbackNegativo: number;
  padroesFornecedores: number;
  fornecedoresTreinados: number;
  melhoriaMedia: number;
}

interface ProdutoProblematico {
  termo: string;
  fornecedor: string;
  tentativas: number;
  ultimaTentativa: string;
}

const AprendizadoDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [produtosProblematicos, setProdutosProblematicos] = useState<ProdutoProblematico[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarDados = async () => {
    try {
      setRefreshing(true);
      
      // Carregar estatísticas do aprendizado
      const estatisticas = await AprendizadoService.obterEstatisticas();
      
      setStats({
        totalAprendizados: estatisticas.total_registros,
        feedbackPositivo: estatisticas.feedback_positivo,
        feedbackNegativo: estatisticas.feedback_negativo,
        padroesFornecedores: estatisticas.padroes_identificados,
        fornecedoresTreinados: estatisticas.fornecedores_treinados,
        melhoriaMedia: 0 // Calcular baseado nos dados
      });

      // Simular produtos problemáticos (implementar busca real se necessário)
      setProdutosProblematicos([
        {
          termo: "cenoura especial",
          fornecedor: "Fornecedor A",
          tentativas: 5,
          ultimaTentativa: "2024-08-02"
        },
        {
          termo: "batata tipo 1",
          fornecedor: "Fornecedor B", 
          tentativas: 3,
          ultimaTentativa: "2024-08-01"
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do aprendizado');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleExportarAprendizados = () => {
    // Implementar exportação
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  const handleImportarAprendizados = () => {
    // Implementar importação
    toast.info('Funcionalidade de importação em desenvolvimento');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Carregando dados do aprendizado...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p>Erro ao carregar dados do aprendizado</p>
          <Button onClick={carregarDados} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const taxaSucesso = stats.totalAprendizados > 0 
    ? (stats.feedbackPositivo / stats.totalAprendizados) * 100 
    : 0;

  const qualityMetrics = {
    totalExtractions: stats.totalAprendizados,
    successRate: taxaSucesso,
    averageConfidence: 0.75, // Calcular baseado nos dados reais
    improvedProducts: stats.padroesFornecedores,
    supplierAccuracy: {
      'Fornecedor A': 85,
      'Fornecedor B': 78,
      'Fornecedor C': 92
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Sistema de Aprendizado</h2>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarAprendizados}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportarAprendizados}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalAprendizados}</p>
                <p className="text-sm text-gray-600">Total de Registros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{taxaSucesso.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Taxa de Sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.padroesFornecedores}</p>
                <p className="text-sm text-gray-600">Padrões Identificados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.fornecedoresTreinados}</p>
                <p className="text-sm text-gray-600">Fornecedores Treinados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com detalhes */}
      <Tabs defaultValue="qualidade" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
          <TabsTrigger value="problemas">Produtos Problemáticos</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
        </TabsList>

        <TabsContent value="qualidade" className="space-y-4">
          <QualityIndicator metrics={qualityMetrics} />
          
          {/* Feedback Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Feedback Positivo</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.feedbackPositivo / stats.totalAprendizados) * 100} className="w-24 h-2" />
                    <Badge variant="default">{stats.feedbackPositivo}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Feedback Negativo</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(stats.feedbackNegativo / stats.totalAprendizados) * 100} className="w-24 h-2" />
                    <Badge variant="destructive">{stats.feedbackNegativo}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="problemas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Produtos com Dificuldade de Identificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {produtosProblematicos.length > 0 ? (
                <div className="space-y-3">
                  {produtosProblematicos.map((produto, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium">{produto.termo}</p>
                        <p className="text-sm text-gray-600">{produto.fornecedor}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{produto.tentativas} tentativas</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Última: {produto.ultimaTentativa}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum produto problemático identificado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Gráficos de evolução em desenvolvimento</p>
                <p className="text-sm mt-2">
                  Em breve: gráficos de melhoria ao longo do tempo
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AprendizadoDashboard;