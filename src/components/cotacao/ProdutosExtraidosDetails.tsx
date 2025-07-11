import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Eye, EyeOff, Info } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import IndicadorConfianca from './IndicadorConfianca';
import ProdutoExtraidoItem from './ProdutoExtraidoItem';
import EditarProdutoModal from './EditarProdutoModal';

interface ProdutosExtraidosDetailsProps {
  produtosExtraidos: ProdutoExtraido[];
  onEditarProduto?: (produtoEditado: ProdutoExtraido) => void;
  onDeletarProduto?: (produto: ProdutoExtraido) => void;
}

const ProdutosExtraidosDetails: React.FC<ProdutosExtraidosDetailsProps> = ({ 
  produtosExtraidos, 
  onEditarProduto,
  onDeletarProduto 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoExtraido | null>(null);

  const fornecedoresUnicos = [...new Set(produtosExtraidos.map(p => p.fornecedor))];
  
  const handleEditarProduto = (produto: ProdutoExtraido) => {
    setProdutoEditando(produto);
  };

  const handleSalvarProduto = (produtoEditado: ProdutoExtraido) => {
    if (onEditarProduto) {
      onEditarProduto(produtoEditado);
    }
    setProdutoEditando(null);
  };

  const handleDeletarProduto = (produto: ProdutoExtraido) => {
    if (onDeletarProduto) {
      onDeletarProduto(produto);
    }
    setProdutoEditando(null);
  };
  
  if (produtosExtraidos.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between text-left p-4 h-auto">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-lg font-semibold text-gray-700">
                Produtos Extraídos ({produtosExtraidos.length})
              </span>
              <Badge variant="secondary">{fornecedoresUnicos.length} fornecedores</Badge>
            </div>
            <div className="flex items-center gap-2">
              {isOpen ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="text-sm text-muted-foreground">
                {isOpen ? 'Ocultar' : 'Ver detalhes'}
              </span>
            </div>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="data-[state=open]:animate-slide-down data-[state=closed]:animate-slide-up">
          <div className="bg-gray-50 p-4 rounded-lg">
            {fornecedoresUnicos.map(fornecedor => {
              const produtosPorFornecedor = produtosExtraidos.filter(p => p.fornecedor === fornecedor);
              
              return (
                <div key={fornecedor} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base">{fornecedor}</h3>
                    <Badge variant="outline">{produtosPorFornecedor.length} produtos</Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {produtosPorFornecedor.map((produto, index) => (
                      <ProdutoExtraidoItem
                        key={`${produto.produto}-${produto.tipo}-${index}`}
                        produto={produto}
                        onEdit={handleEditarProduto}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Modal de Edição */}
      <EditarProdutoModal
        isOpen={!!produtoEditando}
        onClose={() => setProdutoEditando(null)}
        produto={produtoEditando}
        onSalvar={handleSalvarProduto}
        onDeletar={handleDeletarProduto}
      />
    </div>
  );
};

export default ProdutosExtraidosDetails;