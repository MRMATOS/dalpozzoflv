import React from 'react';
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface EtapasRecebimentoProps {
  etapaAtual: 1 | 2 | 3;
  labels?: string[];
}

const EtapasRecebimento: React.FC<EtapasRecebimentoProps> = ({ 
  etapaAtual, 
  labels = ['Seleção do Pedido', 'Modo de Pesagem', 'Recebimento Ativo'] 
}) => {
  const etapas = [
    { numero: 1, label: labels[0], ativa: etapaAtual >= 1, completa: etapaAtual > 1 },
    { numero: 2, label: labels[1], ativa: etapaAtual >= 2, completa: etapaAtual > 2 },
    { numero: 3, label: labels[2], ativa: etapaAtual >= 3, completa: false },
  ];

  return (
    <div className="flex items-center justify-center space-x-4 py-4">
      {etapas.map((etapa, index) => (
        <div key={etapa.numero} className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full border-2 
              ${etapa.completa 
                ? 'bg-green-500 border-green-500 text-white' 
                : etapa.ativa 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }
            `}>
              {etapa.completa ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{etapa.numero}</span>
              )}
            </div>
            <div className="text-sm">
              <div className={`font-medium ${etapa.ativa ? 'text-gray-900' : 'text-gray-400'}`}>
                {etapa.label}
              </div>
              {etapa.ativa && !etapa.completa && (
                <Badge variant="secondary" className="text-xs mt-1">
                  Atual
                </Badge>
              )}
            </div>
          </div>
          
          {index < etapas.length - 1 && (
            <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
          )}
        </div>
      ))}
    </div>
  );
};

export default EtapasRecebimento;