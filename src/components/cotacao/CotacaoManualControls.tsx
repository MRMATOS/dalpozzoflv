import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface CotacaoManualControlsProps {
  produtosExtraidos: ProdutoExtraido[];
  fornecedoresComProdutos: string[];
  onAdicionarProduto: () => void;
  onEditarProdutos: () => void;
  onLimparTudo: () => void;
}

const CotacaoManualControls: React.FC<CotacaoManualControlsProps> = ({
  produtosExtraidos,
  fornecedoresComProdutos,
  onAdicionarProduto,
  onEditarProdutos,
  onLimparTudo
}) => {
  const produtosSemPreco = produtosExtraidos.filter(p => p.preco === null).length;
  const produtosBaixaConfianca = produtosExtraidos.filter(p => (p.confianca || 0) < 0.6).length;
  const produtosManuais = produtosExtraidos.filter(p => p.origem === 'manual').length;

  const getStatusColor = () => {
    if (produtosBaixaConfianca > 0 || produtosSemPreco > 0) return 'border-yellow-200 bg-yellow-50';
    if (produtosExtraidos.length === 0) return 'border-gray-200 bg-gray-50';
    return 'border-green-200 bg-green-50';
  };

  const getStatusIcon = () => {
    if (produtosBaixaConfianca > 0 || produtosSemPreco > 0) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
    if (produtosExtraidos.length > 0) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return null;
  };

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStatusIcon()}
            Controles Manuais
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              {produtosExtraidos.length} produtos
            </Badge>
            <Badge variant="outline">
              {fornecedoresComProdutos.length} fornecedores
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status da Cotação */}
        {produtosExtraidos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="text-muted-foreground">Sem preço:</span>
              <Badge variant={produtosSemPreco > 0 ? "destructive" : "secondary"}>
                {produtosSemPreco}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="text-muted-foreground">Baixa confiança:</span>
              <Badge variant={produtosBaixaConfianca > 0 ? "destructive" : "secondary"}>
                {produtosBaixaConfianca}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <span className="text-muted-foreground">Manuais:</span>
              <Badge variant="outline">
                {produtosManuais}
              </Badge>
            </div>
          </div>
        )}

        {/* Ações Principais */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onAdicionarProduto}
            disabled={fornecedoresComProdutos.length === 0}
            className="flex items-center gap-2"
            variant="default"
          >
            <Plus className="w-4 h-4" />
            Adicionar Produto
          </Button>

          <Button
            onClick={onEditarProdutos}
            disabled={produtosExtraidos.length === 0}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Editar Produtos
          </Button>

          <Button
            onClick={onLimparTudo}
            disabled={produtosExtraidos.length === 0}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Tudo
          </Button>
        </div>

        {/* Alertas e Dicas */}
        {fornecedoresComProdutos.length === 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            💡 Processe pelo menos um fornecedor antes de adicionar produtos manualmente.
          </div>
        )}

        {produtosSemPreco > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ⚠️ {produtosSemPreco} produto(s) sem preço. Clique em "Editar Produtos" para corrigir.
          </div>
        )}

        {produtosBaixaConfianca > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
            🔍 {produtosBaixaConfianca} produto(s) com baixa confiança de identificação. Recomendamos revisar.
          </div>
        )}

        {produtosExtraidos.length > 0 && produtosSemPreco === 0 && produtosBaixaConfianca === 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            ✅ Todos os produtos estão corretamente identificados e com preços!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CotacaoManualControls;