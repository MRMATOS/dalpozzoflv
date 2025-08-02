import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  FileText, 
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  auditoriaCompletaDicionario,
  validarDicionario,
  verificarProdutosNoBanco,
  sugerirCorrecoes
} from '@/utils/productExtraction/dictionaryValidator';

import {
  manutencaoCompletaSinonimos,
  sincronizarSinonimosDicionario,
  auditarSinonimos
} from '@/utils/productExtraction/synonymsManager';

interface ResultadoAuditoria {
  validacao: any;
  verificacaoBanco: any;
  sugestoes: any;
  relatorio: string;
}

interface ResultadoSinonimos {
  sincronizacao: any;
  limpeza: any;
  auditoria: any;
}

export const Fase3AuditoriaDicionario: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [resultadoAuditoria, setResultadoAuditoria] = useState<ResultadoAuditoria | null>(null);
  const [resultadoSinonimos, setResultadoSinonimos] = useState<ResultadoSinonimos | null>(null);
  const [progresso, setProgresso] = useState(0);

  const executarAuditoriaCompleta = async () => {
    setLoading(true);
    setProgresso(0);
    
    try {
      toast.info('Iniciando auditoria completa do dicionário...');
      
      // Etapa 1: Auditoria do dicionário
      setProgresso(25);
      const auditoria = await auditoriaCompletaDicionario();
      setResultadoAuditoria(auditoria);
      
      // Etapa 2: Manutenção de sinônimos
      setProgresso(50);
      toast.info('Sincronizando sinônimos...');
      const sinonimos = await manutencaoCompletaSinonimos();
      setResultadoSinonimos(sinonimos);
      
      setProgresso(100);
      toast.success('Fase 3 executada com sucesso!');
      
    } catch (error) {
      console.error('Erro na Fase 3:', error);
      toast.error(`Erro na execução: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const executarSincronizacaoSinonimos = async () => {
    setLoading(true);
    try {
      toast.info('Sincronizando sinônimos...');
      const resultado = await sincronizarSinonimosDicionario();
      
      // Atualizar resultado parcial
      setResultadoSinonimos(prev => ({
        ...prev,
        sincronizacao: resultado,
        limpeza: prev?.limpeza || { removidos: 0, detalhes: [] },
        auditoria: prev?.auditoria || { totalSinonimos: 0, produtosComSinonimos: 0, produtosSemSinonimos: 0, sinonimosOrfaos: 0, estatisticas: [] }
      }));
      
      toast.success(`${resultado.adicionados} sinônimos sincronizados!`);
    } catch (error) {
      toast.error('Erro na sincronização de sinônimos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fase 3: Auditoria e Correção do Dicionário</h2>
          <p className="text-muted-foreground">
            Sistema de validação e correção automática do dicionário de produtos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={executarSincronizacaoSinonimos}
            disabled={loading}
            variant="outline"
          >
            <Database className="w-4 h-4 mr-2" />
            Sincronizar Sinônimos
          </Button>
          
          <Button
            onClick={executarAuditoriaCompleta}
            disabled={loading}
            size="lg"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Executar Fase 3 Completa
          </Button>
        </div>
      </div>

      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Executando auditoria...</span>
                <span className="text-sm text-muted-foreground">{progresso}%</span>
              </div>
              <Progress value={progresso} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {resultadoAuditoria && (
        <Tabs defaultValue="relatorio" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="relatorio">Relatório</TabsTrigger>
            <TabsTrigger value="problemas">Problemas</TabsTrigger>
            <TabsTrigger value="banco">Verificação DB</TabsTrigger>
            <TabsTrigger value="sugestoes">Sugestões</TabsTrigger>
          </TabsList>

          <TabsContent value="relatorio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Relatório de Auditoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                  {resultadoAuditoria.relatorio}
                </pre>
              </CardContent>
            </Card>

            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {resultadoAuditoria.validacao.estatisticas.totalProdutos}
                  </div>
                  <p className="text-xs text-muted-foreground">Produtos no Dicionário</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {resultadoAuditoria.validacao.estatisticas.totalAliases}
                  </div>
                  <p className="text-xs text-muted-foreground">Total de Aliases</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">
                    {resultadoAuditoria.validacao.problemas.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Problemas Encontrados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">
                    {resultadoAuditoria.verificacaoBanco.estatisticas.encontrados}
                  </div>
                  <p className="text-xs text-muted-foreground">Produtos no Banco</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="problemas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Problemas Encontrados ({resultadoAuditoria.validacao.problemas.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resultadoAuditoria.validacao.problemas.map((problema: any, index: number) => (
                    <Alert key={index}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center gap-2">
                        <Badge variant={
                          problema.tipo === 'alias_duplicado' ? 'destructive' :
                          problema.tipo === 'produto_sem_padrao' ? 'default' :
                          'secondary'
                        }>
                          {problema.tipo.replace('_', ' ')}
                        </Badge>
                        {problema.produto} {problema.variacao && `- ${problema.variacao}`}
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        <div className="space-y-1">
                          <p>{problema.descricao}</p>
                          {problema.sugestao && (
                            <p className="text-sm font-medium text-blue-600">
                              💡 {problema.sugestao}
                            </p>
                          )}
                          {problema.aliases && (
                            <p className="text-xs text-muted-foreground">
                              Aliases: {problema.aliases.join(', ')}
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banco" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Produtos Encontrados ({resultadoAuditoria.verificacaoBanco.estatisticas.encontrados})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {resultadoAuditoria.verificacaoBanco.produtosEncontrados.map((produto: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="font-medium">{produto.produto}</span>
                        <Badge variant="outline">{produto.variacoes.length} variações</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Produtos Não Encontrados ({resultadoAuditoria.verificacaoBanco.estatisticas.naoEncontrados})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {resultadoAuditoria.verificacaoBanco.produtosNaoEncontrados.map((produto: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="font-medium">{produto.produto}</span>
                        <Badge variant="destructive">{produto.variacoes.length} variações</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sugestoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Sugestões de Correção ({resultadoAuditoria.sugestoes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resultadoAuditoria.sugestoes.map((sugestao: any, index: number) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{sugestao.problema.tipo}</Badge>
                        <span className="font-medium">
                          {sugestao.problema.produto} {sugestao.problema.variacao && `- ${sugestao.problema.variacao}`}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {sugestao.correcaoSugerida}
                      </p>
                      
                      <div className="bg-muted p-3 rounded font-mono text-sm">
                        <code>{sugestao.codigo}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {resultadoSinonimos && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Resultado da Sincronização de Sinônimos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {resultadoSinonimos.sincronizacao?.adicionados || 0}
                </div>
                <p className="text-sm text-muted-foreground">Sinônimos Adicionados</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {resultadoSinonimos.limpeza?.removidos || 0}
                </div>
                <p className="text-sm text-muted-foreground">Órfãos Removidos</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {resultadoSinonimos.auditoria?.totalSinonimos || 0}
                </div>
                <p className="text-sm text-muted-foreground">Total no Banco</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Fase3AuditoriaDicionario;