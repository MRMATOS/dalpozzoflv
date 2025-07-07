
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface Product {
  id: string;
  produto: string;
  unidade: string;
  media_por_caixa?: number;
}

interface ProductCardProps {
  product: Product;
  onQuantityChange: (productId: string, caixas: number, quilos: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuantityChange }) => {
  const [caixas, setCaixas] = useState<number>(0);

  const mediaPorCaixa = product.media_por_caixa || 20;

  const updateQuantity = (novaQuantidadeCaixas: number) => {
    const quantidadeFinal = Math.max(0, novaQuantidadeCaixas);
    setCaixas(quantidadeFinal);
    
    // Calcular equivalência em quilos
    const quilos = quantidadeFinal * mediaPorCaixa;
    onQuantityChange(product.id, quantidadeFinal, quilos);
  };

  const handleInputChange = (value: string) => {
    const numericValue = parseInt(value) || 0;
    updateQuantity(numericValue);
  };

  const incrementar = () => {
    updateQuantity(caixas + 1);
  };

  const decrementar = () => {
    updateQuantity(caixas - 1);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 truncate">{product.produto}</h3>
            <p className="text-sm text-gray-500">
              {product.unidade} • {mediaPorCaixa}kg por caixa
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={decrementar}
              disabled={caixas === 0}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <Input
              type="number"
              value={caixas}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-20 text-center h-8 flex-shrink-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              min="0"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={incrementar}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
