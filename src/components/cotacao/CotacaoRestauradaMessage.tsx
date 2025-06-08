
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock } from 'lucide-react';

interface CotacaoRestauradaMessageProps {
  dataRestauracao: Date;
}

const CotacaoRestauradaMessage: React.FC<CotacaoRestauradaMessageProps> = ({ dataRestauracao }) => {
  const dataFormatada = dataRestauracao.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <Clock className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-700">
        Cotação restaurada do dia {dataFormatada}
      </AlertDescription>
    </Alert>
  );
};

export default CotacaoRestauradaMessage;
