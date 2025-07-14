import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CotacaoValidator } from '@/utils/cotacaoValidation';
import { Shield, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface SystemHealthIndicatorProps {
  cotacaoHook?: any;
  produtosExtraidos?: any[];
}

const SystemHealthIndicator: React.FC<SystemHealthIndicatorProps> = ({ 
  cotacaoHook, 
  produtosExtraidos = [] 
}) => {
  const [healthStatus, setHealthStatus] = useState({
    critical: true,
    extraction: true,
    system: true,
    lastCheck: Date.now()
  });

  const runHealthCheck = () => {
    const status = {
      critical: cotacaoHook ? CotacaoValidator.validateCriticalFunctions(cotacaoHook) : true,
      extraction: CotacaoValidator.validateExtractionIntegrity(produtosExtraidos),
      system: CotacaoValidator.runSystemIntegrityCheck(),
      lastCheck: Date.now()
    };
    
    setHealthStatus(status);
  };

  useEffect(() => {
    runHealthCheck();
  }, [cotacaoHook, produtosExtraidos]);

  const getOverallStatus = () => {
    const { critical, extraction, system } = healthStatus;
    if (critical && extraction && system) {
      return { status: 'healthy', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
    return { status: 'issues', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
  };

  const overall = getOverallStatus();
  const OverallIcon = overall.icon;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Status do Sistema</span>
          </div>
          <Badge className={overall.color}>
            <OverallIcon className="h-3 w-3 mr-1" />
            {overall.status === 'healthy' ? 'Íntegro' : 'Problemas'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
              healthStatus.critical ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {healthStatus.critical ? (
                <CheckCircle className="h-3 w-3 text-white" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-white" />
              )}
            </div>
            <div className="text-xs text-gray-600">Funções</div>
          </div>
          
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
              healthStatus.extraction ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {healthStatus.extraction ? (
                <CheckCircle className="h-3 w-3 text-white" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-white" />
              )}
            </div>
            <div className="text-xs text-gray-600">Extração</div>
          </div>
          
          <div className="text-center">
            <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mb-1 ${
              healthStatus.system ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {healthStatus.system ? (
                <CheckCircle className="h-3 w-3 text-white" />
              ) : (
                <AlertTriangle className="h-3 w-3 text-white" />
              )}
            </div>
            <div className="text-xs text-gray-600">Sistema</div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runHealthCheck}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Verificar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthIndicator;