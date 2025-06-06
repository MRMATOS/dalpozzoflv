
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FornecedorCellProps {
  preco: number | null;
  quantidade: number;
  unidadePedido: string;
  isMelhorPreco: boolean;
  opcoesUnidade: string[];
  onQuantidadeChange: (value: string) => void;
  onUnidadeChange: (value: string) => void;
}

const FornecedorCell: React.FC<FornecedorCellProps> = ({
  preco,
  quantidade,
  unidadePedido,
  isMelhorPreco,
  opcoesUnidade,
  onQuantidadeChange,
  onUnidadeChange
}) => {
  if (preco === null) {
    return (
      <div className="p-3 flex items-center justify-center h-full min-w-[180px]">
        <div className="text-gray-400">-</div>
      </div>
    );
  }

  return (
    <div className="p-3 w-full space-y-2 min-w-[180px]">
      {/* Preço */}
      <div className={`font-semibold text-center w-full text-sm ${isMelhorPreco ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-gray-700'}`}>
        R$ {preco.toFixed(2)}
        {isMelhorPreco && ' 🏆'}
      </div>
      
      {/* Dropdown "Pedir em" - sempre mostra placeholder fixo */}
      <div className="w-full">
        <Select onValueChange={onUnidadeChange}>
          <SelectTrigger className="w-full text-sm h-8">
            <SelectValue placeholder="Pedir em:" />
          </SelectTrigger>
          <SelectContent className="z-50 bg-white border shadow-lg">
            {opcoesUnidade.map(unidade => (
              <SelectItem key={unidade} value={unidade} className="text-sm">
                {unidade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Input de quantidade com unidade alinhada à direita */}
      <div className="relative w-full">
        <Input
          type="number"
          placeholder="Qtd"
          min="0"
          value={quantidade || ''}
          onChange={(e) => onQuantidadeChange(e.target.value)}
          className="w-full text-left pr-12 h-8 text-sm"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
          {unidadePedido || 'Caixa'}
        </div>
      </div>
    </div>
  );
};

export default FornecedorCell;
