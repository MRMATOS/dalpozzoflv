import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, MessageSquare } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface ProdutoComAprendizadoProps {
  produto: ProdutoExtraido;
  textoOriginal: string;
  onFeedback: (produto: ProdutoExtraido, texto: string) => void;
  onEdit: (produto: ProdutoExtraido) => void;
}

const ProdutoComAprendizado: React.FC<ProdutoComAprendizadoProps> = ({
  produto,
  textoOriginal,
  onFeedback,
  onEdit
}) => {
  const getCorAprendizado = () => {
    if (produto.origem === 'manual') return 'border-blue-200 bg-blue-50';
    if (produto.origem === 'banco') return 'border-green-200 bg-green-50';
    if ((produto.confianca || 0) >= 0.8) return 'border-green-200 bg-green-50';
    if ((produto.confianca || 0) >= 0.6) return 'border-yellow-200 bg-yellow-50';
    return 'border-red-200 bg-red-50';
  };

  const getIconeOrigem = () => {
    switch (produto.origem) {
      case 'manual': return '👤';
      case 'banco': return '💾';
      case 'sinonimo': return '🔗';
      case 'dicionario': return '📚';
      default: return '❓';
    }
  };

  const podeReceberFeedback = produto.origem !== 'manual';

  return (
    <div className={`p-4 border rounded-lg ${getCorAprendizado()} relative group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{getIconeOrigem()}</span>
            <h4 className="font-medium text-sm truncate">{produto.produto}</h4>
            {podeReceberFeedback && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFeedback(produto, textoOriginal)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                title="Dar feedback para aprendizado"
              >
                <Brain className="w-4 h-4 text-purple-600" />
              </Button>
            )}
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
              <span className="text-muted-foreground">Origem:</span>
              <Badge 
                variant={produto.origem === 'manual' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {produto.origem}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Confiança:</span>
              <div className="flex items-center gap-1">
                <Star className={`w-3 h-3 ${(produto.confianca || 0) >= 0.8 ? 'text-green-600 fill-current' : 'text-gray-300'}`} />
                <span>{Math.round((produto.confianca || 0) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(produto)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>

      {produto.origem === 'banco' && (
        <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
          🧠 Produto aprimorado pelo sistema de aprendizado
        </div>
      )}
    </div>
  );
};

export default ProdutoComAprendizado;