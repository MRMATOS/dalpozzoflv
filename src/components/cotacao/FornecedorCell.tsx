
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';

interface FornecedorCellProps {
  preco: number | null;
  quantidade: number;
  unidadePedido: string;
  isMelhorPreco: boolean;
  opcoesUnidade: string[];
  onQuantidadeChange: (value: string) => void;
  onUnidadeChange: (value: string) => void;
  onPrecoChange: (value: string) => void;
}

const FornecedorCell: React.FC<FornecedorCellProps> = ({
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

  // Verificar se preco é null, undefined ou não é um número válido
  if (preco === null || preco === undefined || typeof preco !== 'number') {
    return (
      <td className="p-3 w-[180px] min-w-[180px] text-center">
        <div className="text-gray-400">-</div>
      </td>
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
    <td className="p-3 w-[180px] min-w-[180px]">
      <div className="space-y-2">
        {/* Preço editável */}
        <div className={`font-semibold text-center w-full text-sm ${isMelhorPreco ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-gray-700'}`}>
          {editandoPreco ? (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={precoEditado}
                onChange={(e) => setPrecoEditado(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-7 text-xs px-1"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={confirmarEdicaoPreco}
              >
                <Check className="h-3 w-3 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={cancelarEdicaoPreco}
              >
                <X className="h-3 w-3 text-red-600" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1 group">
              <span>R$ {preco.toFixed(2)}</span>
              {isMelhorPreco && ' 🏆'}
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={iniciarEdicaoPreco}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Dropdown "Pedir em" - sempre mostra texto fixo */}
        <div className="w-full">
          <Select onValueChange={onUnidadeChange}>
            <SelectTrigger className="w-full text-sm h-8">
              <span className="text-gray-700">Pedir em:</span>
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
    </td>
  );
};

export default FornecedorCell;
