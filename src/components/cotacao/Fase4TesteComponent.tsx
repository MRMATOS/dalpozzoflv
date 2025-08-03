import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, PlayCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { executarTesteFase4, gerarRelatorioFase4 } from '@/utils/testFase4';
import { toast } from 'sonner';

interface TesteResultado {
  mensagem: string;
  esperado: { produto: string; tipo: string };
  resultado: { produto: string; tipo: string } | null;
  sucesso: boolean;
  observacao: string;
}

const Fase4TesteComponent: React.FC = () => {
  const [executandoTeste, setExecutandoTeste] = useState(false);
  const [resultados, setResultados] = useState<TesteResultado[]>([]);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  const executarTestes = async () => {
    setExecutandoTeste(true);
    try {
      toast.info('Iniciando testes da Fase 4...', {
        description: 'Verificando se o sistema parou de inserir "Padrão" artificialmente'
      });
      
      const resultadosTeste = await executarTesteFase4();
      setResultados(resultadosTeste);
      
      const sucessos = resultadosTeste.filter(r => r.sucesso).length;
      const total = resultadosTeste.length;
      
      if (sucessos === total) {
        toast.success('Fase 4 concluída com sucesso!', {
          description: `Todos os ${total} testes passaram. O "Padrão" artificial foi eliminado.`
        });
      } else {
        toast.warning('Fase 4 parcialmente implementada', {
          description: `${sucessos}/${total} testes passaram. Algumas correções ainda são necessárias.`
        });
      }
      
    } catch (error) {
      console.error('Erro ao executar testes:', error);
      toast.error('Erro ao executar testes', {
        description: 'Verifique o console para mais detalhes.'
      });
    } finally {
      setExecutandoTeste(false);
    }
  };

  const baixarRelatorio = () => {
    if (resultados.length === 0) {
      toast.warning('Execute os testes primeiro');
      return;
    }
    
    const relatorio = gerarRelatorioFase4(resultados);
    const blob = new Blob([relatorio], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-fase4-testes.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Relatório baixado com sucesso!');
  };

  const getStatusIcon = (sucesso: boolean) => {
    return sucesso ? (
      <CheckCircle2 className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getSucessos = () => resultados.filter(r => r.sucesso).length;
  const getTotal = () => resultados.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Fase 4: Testes de Eliminação do "Padrão" Artificial
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Testa se o sistema parou de inserir artificialmente "Padrão" como variação quando 
          o produto não possui variação específica na mensagem do fornecedor.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={executarTestes} 
            disabled={executandoTeste}
            className="flex items-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {executandoTeste ? 'Executando...' : 'Executar Testes'}
          </Button>
          
          {resultados.length > 0 && (
            <Button 
              variant="outline" 
              onClick={baixarRelatorio}
              className="flex items-center gap-2"
            >
              Baixar Relatório
            </Button>
          )}
        </div>

        {resultados.length > 0 && (
          <div className="space-y-4">
            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{getTotal()}</div>
                  <div className="text-sm text-muted-foreground">Total de Testes</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{getSucessos()}</div>
                  <div className="text-sm text-muted-foreground">Sucessos</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {((getSucessos() / getTotal()) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                </div>
              </Card>
            </div>

            {/* Status geral */}
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              {getSucessos() === getTotal() ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-semibold text-green-800">Fase 4 Concluída com Sucesso!</div>
                    <div className="text-sm text-green-700">Todos os testes passaram. O "Padrão" artificial foi eliminado completamente.</div>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <div>
                    <div className="font-semibold text-orange-800">Fase 4 Parcialmente Implementada</div>
                    <div className="text-sm text-orange-700">
                      {getTotal() - getSucessos()} de {getTotal()} testes falharam. 
                      Algumas correções ainda são necessárias.
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Detalhes dos testes */}
            <Collapsible open={mostrarDetalhes} onOpenChange={setMostrarDetalhes}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <ChevronDown className={`w-4 h-4 transition-transform ${mostrarDetalhes ? 'rotate-180' : ''}`} />
                  {mostrarDetalhes ? 'Ocultar' : 'Mostrar'} Detalhes dos Testes
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-3 mt-4">
                {resultados.map((resultado, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(resultado.sucesso)}
                      <div className="flex-1 space-y-2">
                        <div className="font-medium">Teste {index + 1}: "{resultado.mensagem}"</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Esperado:</span>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{resultado.esperado.produto}</Badge>
                              {resultado.esperado.tipo ? (
                                <Badge variant="secondary">{resultado.esperado.tipo}</Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">(sem tipo)</Badge>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <span className="font-medium text-muted-foreground">Resultado:</span>
                            <div className="flex gap-2 mt-1">
                              {resultado.resultado ? (
                                <>
                                  <Badge variant="outline">{resultado.resultado.produto}</Badge>
                                  {resultado.resultado.tipo ? (
                                    <Badge variant="secondary">{resultado.resultado.tipo}</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground">(sem tipo)</Badge>
                                  )}
                                </>
                              ) : (
                                <Badge variant="destructive">Nenhum produto extraído</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {resultado.observacao}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Fase4TesteComponent;