import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, RefreshCw } from 'lucide-react';
import { migrarDicionarioParaSinonimos, verificarStatusMigracao } from '@/services/cotacao/migrationService';
import { useToast } from '@/hooks/use-toast';

interface MigracaoStatusProps {
  onMigracaoCompleta?: () => void;
}

const MigracaoStatus: React.FC<MigracaoStatusProps> = ({ onMigracaoCompleta }) => {
  const [status, setStatus] = useState<{ totalSinonimos: number; migracaoNecessaria: boolean } | null>(null);
  const [executandoMigracao, setExecutandoMigracao] = useState(false);
  const [verificandoStatus, setVerificandoStatus] = useState(false);
  const { toast } = useToast();

  const verificarStatus = async () => {
    setVerificandoStatus(true);
    try {
      const novoStatus = await verificarStatusMigracao();
      setStatus(novoStatus);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status da migração.",
        variant: "destructive"
      });
    } finally {
      setVerificandoStatus(false);
    }
  };

  const executarMigracao = async () => {
    setExecutandoMigracao(true);
    try {
      await migrarDicionarioParaSinonimos();
      toast({
        title: "Migração Concluída",
        description: "Dicionário migrado para o banco de dados com sucesso!",
      });
      await verificarStatus();
      onMigracaoCompleta?.();
    } catch (error) {
      console.error('Erro na migração:', error);
      toast({
        title: "Erro na Migração",
        description: "Falha ao migrar o dicionário. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    } finally {
      setExecutandoMigracao(false);
    }
  };

  useEffect(() => {
    verificarStatus();
  }, []);

  if (!status) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Verificando status da migração...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Status da Migração do Dicionário
        </CardTitle>
        <CardDescription>
          Sistema de sinônimos para identificação de produtos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Sinônimos no banco:</span>
            <Badge variant={status.totalSinonimos > 0 ? "default" : "secondary"}>
              {status.totalSinonimos} registros
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <div className="flex items-center">
              {status.migracaoNecessaria ? (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                  <Badge variant="outline">Migração Necessária</Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <Badge variant="default">Migração Completa</Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {status.migracaoNecessaria && (
              <Button 
                onClick={executarMigracao}
                disabled={executandoMigracao}
                className="flex-1"
              >
                {executandoMigracao ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Executando Migração...
                  </>
                ) : (
                  'Executar Migração'
                )}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={verificarStatus}
              disabled={verificandoStatus}
            >
              {verificandoStatus ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                'Atualizar'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MigracaoStatus;