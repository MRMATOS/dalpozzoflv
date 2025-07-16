
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Pallet {
  id: string;
  ordem: number;
  peso_kg: number;
  utilizado?: boolean;
}

interface PalletsVisualizacaoProps {
  pallets: Pallet[];
  palletsUtilizados: number[];
  onPalletsChange: (pallets: number[]) => void;
  palletsIndisponiveis: number[];
  modoMedia?: boolean;
  modoIndividual?: boolean;
}

const PalletsVisualizacao: React.FC<PalletsVisualizacaoProps> = ({
  pallets,
  palletsUtilizados,
  onPalletsChange,
  palletsIndisponiveis,
  modoMedia = false,
  modoIndividual = false
}) => {
  // Separar pallets disponíveis (incluindo os selecionados no formulário atual)
  const palletsDisponiveis = pallets
    .filter(p => {
      // Mostrar se está disponível OU se está selecionado no formulário atual
      return !palletsIndisponiveis.includes(p.ordem) || palletsUtilizados.includes(p.ordem);
    })
    .sort((a, b) => b.ordem - a.ordem); // Último primeiro

  // Pallets que já foram usados em produtos anteriores (sem os do formulário atual)
  const palletsUsados = pallets
    .filter(p => palletsIndisponiveis.includes(p.ordem) && !palletsUtilizados.includes(p.ordem))
    .sort((a, b) => b.ordem - a.ordem);

  const togglePallet = (ordem: number) => {
    if (palletsUtilizados.includes(ordem)) {
      onPalletsChange(palletsUtilizados.filter(p => p !== ordem));
    } else {
      onPalletsChange([...palletsUtilizados, ordem].sort((a, b) => a - b));
    }
  };

  // No modo média, apenas mostrar informações dos pallets sem seleção
  if (modoMedia) {
    const palletsRestantes = pallets.filter(p => !palletsIndisponiveis.includes(p.ordem));
    const pesoTotalRestante = palletsRestantes.reduce((acc, p) => acc + p.peso_kg, 0);
    
    return (
      <div className="space-y-3">
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">Pallets Restantes (Modo Média)</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Quantidade:</div>
              <div className="font-bold text-lg">{palletsRestantes.length}</div>
            </div>
            <div>
              <div className="text-gray-600">Peso Total:</div>
              <div className="font-bold text-lg">{pesoTotalRestante.toFixed(1)} kg</div>
            </div>
          </div>
          {palletsRestantes.length > 0 && (
            <div className="mt-2 text-xs text-blue-600">
              Pallets: {palletsRestantes.map(p => `P${p.ordem}`).join(', ')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // No modo individual, mostrar palete atual e próximo automaticamente
  if (modoIndividual) {
    const palletsDisponiveis = pallets
      .filter(p => !palletsIndisponiveis.includes(p.ordem))
      .sort((a, b) => a.ordem - b.ordem); // Menor primeiro para ordem sequencial

    const palletAtual = palletsDisponiveis[0];
    const proximoPallet = palletsDisponiveis[1];
    
    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-gray-700">Sequência de Pallets:</div>
        
        {palletAtual && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">Palete Atual</div>
            <div className="flex items-center justify-between">
              <span className="font-bold">P{palletAtual.ordem}</span>
              <Badge variant="default" className="bg-green-600">
                {palletAtual.peso_kg.toFixed(1)} kg
              </Badge>
            </div>
          </div>
        )}
        
        {proximoPallet && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">Próximo Palete</div>
            <div className="flex items-center justify-between">
              <span className="font-bold">P{proximoPallet.ordem}</span>
              <Badge variant="outline" className="border-blue-300">
                {proximoPallet.peso_kg.toFixed(1)} kg
              </Badge>
            </div>
          </div>
        )}
        
        {!palletAtual && (
          <div className="text-center py-4 text-gray-500 text-sm">
            Todos os pallets foram utilizados
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Pallets Disponíveis */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Pallets disponíveis:</div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {palletsDisponiveis.map((pallet) => (
            <div 
              key={pallet.id} 
              className={`flex items-center space-x-2 p-2 rounded border ${
                palletsUtilizados.includes(pallet.ordem) ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <Checkbox
                id={`pallet-${pallet.ordem}`}
                checked={palletsUtilizados.includes(pallet.ordem)}
                onCheckedChange={() => togglePallet(pallet.ordem)}
              />
              <Label 
                htmlFor={`pallet-${pallet.ordem}`} 
                className="flex-1 cursor-pointer text-sm"
              >
                <div className="flex items-center justify-between">
                  <span>P{pallet.ordem}</span>
                  <Badge variant="outline" className="text-xs">
                    {pallet.peso_kg.toFixed(1)}kg
                  </Badge>
                </div>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Pallets Utilizados */}
      {palletsUsados.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Pallets utilizados:</div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {palletsUsados.map((pallet) => (
              <div 
                key={pallet.id} 
                className="flex items-center space-x-2 p-2 rounded border bg-gray-50 border-gray-200 opacity-60"
              >
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <Label className="flex-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>P{pallet.ordem}</span>
                    <Badge variant="secondary" className="text-xs">
                      {pallet.peso_kg.toFixed(1)}kg
                    </Badge>
                  </div>
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {palletsDisponiveis.length === 0 && palletsUsados.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          Nenhum pallet registrado
        </div>
      )}
    </div>
  );
};

export default PalletsVisualizacao;
