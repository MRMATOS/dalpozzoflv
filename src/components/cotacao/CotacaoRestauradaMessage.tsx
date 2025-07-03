
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, RefreshCw } from 'lucide-react';

interface CotacaoRestauradaMessageProps {
  dataRestauracao: Date;
  tipoRestauracao?: 'rascunho' | 'enviada';
}

const CotacaoRestauradaMessage: React.FC<CotacaoRestauradaMessageProps> = ({ 
  dataRestauracao, 
  tipoRestauracao = 'rascunho' 
}) => {
  const dataFormatada = dataRestauracao.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const isEnviada = tipoRestauracao === 'enviada';
  
  return (
    <Alert className={`mb-4 ${isEnviada ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
      {isEnviada ? (
        <RefreshCw className="h-4 w-4 text-green-600" />
      ) : (
        <Clock className="h-4 w-4 text-blue-600" />
      )}
      <AlertDescription className={isEnviada ? 'text-green-700' : 'text-blue-700'}>
        {isEnviada ? (
          <>
            Continuando cotação enviada do dia {dataFormatada}
            <br />
            <span className="text-sm opacity-75">Uma nova cotação será criada quando você salvar</span>
          </>
        ) : (
          <>
            Rascunho restaurado do dia {dataFormatada}
          </>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default CotacaoRestauradaMessage;
