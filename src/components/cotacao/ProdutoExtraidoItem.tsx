import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit3, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface ProdutoExtraidoItemProps {
  produto: ProdutoExtraido;
  onEdit: (produto: ProdutoExtraido) => void;
}

const ProdutoExtraidoItem: React.FC<ProdutoExtraidoItemProps> = ({ produto, onEdit }) => {
  const getIconeConfianca = (confianca: number) => {
    if (confianca >= 0.8) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (confianca >= 0.6) return <HelpCircle className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getCorConfianca = (confianca: number) => {
    if (confianca >= 0.8) return 'border-green-200 bg-green-50';
    if (confianca >= 0.6) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const getBadgeVariant = (confianca: number) => {
    if (confianca >= 0.8) return 'default';
    if (confianca >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className={`p-4 border rounded-lg ${getCorConfianca(produto.confianca || 0)} relative group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {getIconeConfianca(produto.confianca || 0)}
            <h4 className="font-medium text-sm truncate">{produto.produto}</h4>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Tipo:</span>
              <Badge variant="outline" className="text-xs">
                {produto.tipo}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Preço:</span>
              {produto.preco !== null ? (
                <span className="font-medium text-green-600">
                  R$ {produto.preco.toFixed(2)}
                </span>
              ) : (
                <span className="text-red-600 italic">Não informado</span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Unidade:</span>
              <span>{produto.unidade || 'Caixa'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Confiança:</span>
              <Badge 
                variant={getBadgeVariant(produto.confianca || 0)}
                className="text-xs"
              >
                {Math.round((produto.confianca || 0) * 100)}%
              </Badge>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(produto)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
        >
          <Edit3 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProdutoExtraidoItem;