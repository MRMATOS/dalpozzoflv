import React from 'react';

interface EstoqueDisplayProps {
  produto: string;
  tipo: string;
  onObterEstoques: (produto: string, tipo: string) => React.ReactNode;
}

const EstoqueDisplay = React.memo<EstoqueDisplayProps>(({ produto, tipo, onObterEstoques }) => {
  return <>{onObterEstoques(produto, tipo)}</>;
});

EstoqueDisplay.displayName = 'EstoqueDisplay';

export default EstoqueDisplay;