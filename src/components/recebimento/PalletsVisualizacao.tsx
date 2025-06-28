
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
}

const PalletsVisualizacao: React.FC<PalletsVisualizacaoProps> = ({
  pallets,
  palletsUtilizados,
  onPalletsChange,
  palletsIndisponiveis
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

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Pallets Utilizados</Label>
      
      {/* Pallets Disponíveis */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 font-medium">Disponíveis:</div>
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

      {/* Pallets Indisponíveis */}
      {palletsUsados.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 font-medium">Utilizados:</div>
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
