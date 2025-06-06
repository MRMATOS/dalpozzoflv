
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
      <div className="p-4 flex items-center justify-center h-full">
        <div className="text-gray-400">-</div>
      </div>
    );
  }

  return (
    <div className="p-4 w-full space-y-3">
      {/* Preço */}
      <div className={`font-semibold text-center w-full ${isMelhorPreco ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-gray-700'}`}>
        R$ {preco.toFixed(2)}
        {isMelhorPreco && ' 🏆'}
      </div>
      
      {/* Dropdown "Pedir em" */}
      <div className="w-full">
        <Select value={unidadePedido || 'Caixa'} onValueChange={onUnidadeChange}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Pedir em:" />
          </SelectTrigger>
          <SelectContent>
            {opcoesUnidade.map(unidade => (
              <SelectItem key={unidade} value={unidade}>
                Pedir em: {unidade}
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
          className="w-full text-left pr-12"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
          {unidadePedido || 'Caixa'}
        </div>
      </div>
    </div>
  );
};

export default FornecedorCell;
