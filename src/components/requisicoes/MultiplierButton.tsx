
import React from 'react';
import { Button } from '@/components/ui/button';

interface MultiplierButtonProps {
  multiplier: number; // 1, 2, 3
  onClick: () => void;
  className?: string;
}

const MultiplierButton: React.FC<MultiplierButtonProps> = ({ multiplier, onClick, className = "" }) => {
  const getButtonText = () => {
    if (multiplier === 1) return "X 2";
    if (multiplier === 2) return "X 2";
    if (multiplier === 3) return "X 3";
    return "X 2";
  };

  const isActive = multiplier > 1;

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={`min-w-[60px] ${isActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'text-gray-600'} ${className}`}
    >
      {getButtonText()}
    </Button>
  );
};

export default MultiplierButton;
