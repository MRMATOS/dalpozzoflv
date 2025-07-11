import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Eye, EyeOff, Info } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import IndicadorConfianca from './IndicadorConfianca';
import ProdutoExtraidoItem from './ProdutoExtraidoItem';
import ProdutoComAprendizado from './ProdutoComAprendizado';
import EditarProdutoModal from './EditarProdutoModal';
import FeedbackAprendizadoModal from './FeedbackAprendizadoModal';

interface ProdutosExtraidosDetailsProps {
  produtosExtraidos: ProdutoExtraido[];
  textoOriginalPorFornecedor?: { [fornecedor: string]: string };
  onEditarProduto?: (produtoEditado: ProdutoExtraido) => void;
  onDeletarProduto?: (produto: ProdutoExtraido) => void;
  onFeedbackEnviado?: () => void;
}

const ProdutosExtraidosDetails: React.FC<ProdutosExtraidosDetailsProps> = ({ 
  produtosExtraidos, 
  textoOriginalPorFornecedor = {},
  onEditarProduto,
  onDeletarProduto,
  onFeedbackEnviado
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoExtraido | null>(null);
  const [produtoFeedback, setProdutoFeedback] = useState<ProdutoExtraido | null>(null);
  const [textoFeedback, setTextoFeedback] = useState('');

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

  const handleFeedback = (produto: ProdutoExtraido, texto: string) => {
    setProdutoFeedback(produto);
    setTextoFeedback(texto || textoOriginalPorFornecedor[produto.fornecedor] || '');
  };

  const handleFeedbackEnviado = () => {
    if (onFeedbackEnviado) {
      onFeedbackEnviado();
    }
    setProdutoFeedback(null);
    setTextoFeedback('');
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
                      <ProdutoComAprendizado
                        key={`${produto.produto}-${produto.tipo}-${index}`}
                        produto={produto}
                        textoOriginal={textoOriginalPorFornecedor[fornecedor] || produto.linhaOriginal}
                        onFeedback={handleFeedback}
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
      {produtoEditando && (
        <EditarProdutoModal
          isOpen={!!produtoEditando}
          onClose={() => setProdutoEditando(null)}
          produto={produtoEditando}
          onSalvar={handleSalvarProduto}
          onDeletar={(produto) => {
            if (onDeletarProduto) {
              onDeletarProduto(produto);
            }
            setProdutoEditando(null);
          }}
        />
      )}

      {/* Modal de Feedback */}
      <FeedbackAprendizadoModal
        isOpen={!!produtoFeedback}
        onClose={() => setProdutoFeedback(null)}
        produto={produtoFeedback}
        textoOriginal={textoFeedback}
        onFeedbackEnviado={handleFeedbackEnviado}
      />
    </div>
  );
};

export default ProdutosExtraidosDetails;