
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';

interface FornecedorMobileCardProps {
  fornecedor: string;
  preco: number | null;
  quantidade: number;
  unidadePedido: string;
  isMelhorPreco: boolean;
  opcoesUnidade: string[];
  onQuantidadeChange: (value: string) => void;
  onUnidadeChange: (value: string) => void;
  onPrecoChange: (value: string) => void;
}

const FornecedorMobileCard: React.FC<FornecedorMobileCardProps> = ({
  fornecedor,
  preco,
  quantidade,
  unidadePedido,
  isMelhorPreco,
  opcoesUnidade,
  onQuantidadeChange,
  onUnidadeChange,
  onPrecoChange
}) => {
  const [editandoPreco, setEditandoPreco] = useState(false);
  const [precoEditado, setPrecoEditado] = useState('');

  if (preco === null || preco === undefined || typeof preco !== 'number') {
    return (
      <div className="p-3 bg-gray-100 rounded-lg">
        <div className="font-medium text-gray-600 mb-2">{fornecedor}</div>
        <div className="text-gray-400 text-center">Produto não disponível</div>
      </div>
    );
  }

  const iniciarEdicaoPreco = () => {
    setPrecoEditado(preco.toFixed(2));
    setEditandoPreco(true);
  };

  const confirmarEdicaoPreco = () => {
    const novoPreco = parseFloat(precoEditado);
    if (!isNaN(novoPreco) && novoPreco >= 0) {
      onPrecoChange(precoEditado);
    }
    setEditandoPreco(false);
  };

  const cancelarEdicaoPreco = () => {
    setEditandoPreco(false);
    setPrecoEditado('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      confirmarEdicaoPreco();
    } else if (e.key === 'Escape') {
      cancelarEdicaoPreco();
    }
  };

  return (
    <Card className={`${isMelhorPreco ? 'ring-2 ring-green-400 bg-green-50' : 'bg-white'}`}>
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-3">
          <div className="font-medium text-gray-900">{fornecedor}</div>
          <div className={`font-bold text-lg ${isMelhorPreco ? 'text-green-600' : 'text-gray-700'}`}>
            {editandoPreco ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precoEditado}
                  onChange={(e) => setPrecoEditado(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="h-8 text-sm px-2 w-20"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={confirmarEdicaoPreco}
                >
                  <Check className="h-3 w-3 text-green-600" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={cancelarEdicaoPreco}
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group">
                <span>R$ {preco.toFixed(2)}</span>
                {isMelhorPreco && ' 🏆'}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-70 group-hover:opacity-100 transition-opacity ml-1"
                  onClick={iniciarEdicaoPreco}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
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
