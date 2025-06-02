
import React from 'react';

interface ScaleIconProps {
  level: number; // 0, 1, 2, 3
  onClick: () => void;
  className?: string;
}

const ScaleIcon: React.FC<ScaleIconProps> = ({ level, onClick, className = "" }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-end space-x-1 p-2 rounded transition-colors hover:bg-gray-100 ${className}`}
      title={`Escala ${level}`}
    >
      <div className={`w-2 h-4 rounded-sm ${level >= 1 ? 'bg-green-500' : 'bg-gray-300'}`} />
      <div className={`w-2 h-6 rounded-sm ${level >= 2 ? 'bg-green-500' : 'bg-gray-300'}`} />
      <div className={`w-2 h-8 rounded-sm ${level >= 3 ? 'bg-green-500' : 'bg-gray-300'}`} />
    </button>
  );
};

export default ScaleIcon;
