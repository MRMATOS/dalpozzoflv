
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ScaleIcon from './ScaleIcon';
import MultiplierButton from './MultiplierButton';

interface Product {
  id: string;
  produto: string;
  unidade: string;
  escala_abastecimento?: Array<{
    escala1?: number;
    escala2?: number;
    escala3?: number;
  }>;
}

interface ProductCardProps {
  product: Product;
  onQuantityChange: (productId: string, quantity: number, scale: number, multiplier: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onQuantityChange }) => {
  const [scaleLevel, setScaleLevel] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [quantity, setQuantity] = useState<number>(0);

  const escala = product.escala_abastecimento?.[0];

  const calculateQuantity = (scale: number, mult: number) => {
    if (scale === 0) return 0;
    
    let baseQuantity = 0;
    if (scale === 1) baseQuantity = escala?.escala1 || 0;
    if (scale === 2) baseQuantity = escala?.escala2 || 0;
    if (scale === 3) baseQuantity = escala?.escala3 || 0;
    
    return baseQuantity * mult;
  };

  useEffect(() => {
    const newQuantity = calculateQuantity(scaleLevel, multiplier);
    setQuantity(newQuantity);
    onQuantityChange(product.id, newQuantity, scaleLevel, multiplier);
  }, [scaleLevel, multiplier, product.id, escala]);

  const handleScaleClick = () => {
    const newLevel = scaleLevel >= 3 ? 0 : scaleLevel + 1;
    setScaleLevel(newLevel);
  };

  const handleMultiplierClick = () => {
    const newMultiplier = multiplier >= 3 ? 1 : multiplier + 1;
    setMultiplier(newMultiplier);
  };

  const handleQuantityChange = (value: string) => {
    const newQuantity = parseFloat(value) || 0;
    setQuantity(newQuantity);
    onQuantityChange(product.id, newQuantity, scaleLevel, multiplier);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{product.produto}</h3>
            <p className="text-sm text-gray-500">{product.unidade}</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <ScaleIcon level={scaleLevel} onClick={handleScaleClick} />
            
            <MultiplierButton multiplier={multiplier} onClick={handleMultiplierClick} />
            
            <div className="flex flex-col">
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-20 text-center"
                min="0"
                step="0.1"
              />
              <span className="text-xs text-gray-500 text-center mt-1">{product.unidade}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
