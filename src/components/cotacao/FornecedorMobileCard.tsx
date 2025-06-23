
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface FornecedorMobileCardProps {
  fornecedor: string;
  preco: number | null;
  quantidade: number;
  unidadePedido: string;
  isMelhorPreco: boolean;
  opcoesUnidade: string[];
  onQuantidadeChange: (value: string) => void;
  onUnidadeChange: (value: string) => void;
}

const FornecedorMobileCard: React.FC<FornecedorMobileCardProps> = ({
  fornecedor,
  preco,
  quantidade,
  unidadePedido,
  isMelhorPreco,
  opcoesUnidade,
  onQuantidadeChange,
  onUnidadeChange
}) => {
  if (preco === null || preco === undefined || typeof preco !== 'number') {
    return (
      <div className="p-3 bg-gray-100 rounded-lg">
        <div className="font-medium text-gray-600 mb-2">{fornecedor}</div>
        <div className="text-gray-400 text-center">Produto não disponível</div>
      </div>
    );
  }

  return (
    <Card className={`${isMelhorPreco ? 'ring-2 ring-green-400 bg-green-50' : 'bg-white'}`}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-3">
          <div className="font-medium text-gray-900">{fornecedor}</div>
          <div className={`font-bold text-lg ${isMelhorPreco ? 'text-green-600' : 'text-gray-700'}`}>
            R$ {preco.toFixed(2)}
            {isMelhorPreco && ' 🏆'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Selector de unidade */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pedir em:</label>
            <Select onValueChange={onUnidadeChange} value={unidadePedido}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
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
          
          {/* Input de quantidade */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantidade:</label>
            <Input
              type="number"
              placeholder="0"
              min="0"
              value={quantidade || ''}
              onChange={(e) => onQuantidadeChange(e.target.value)}
              className="w-full h-9 text-sm"
            />
          </div>
        </div>
        
        {quantidade > 0 && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-sm text-gray-600">
              Subtotal: <span className="font-semibold text-gray-900">R$ {(preco * quantidade).toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FornecedorMobileCard;
