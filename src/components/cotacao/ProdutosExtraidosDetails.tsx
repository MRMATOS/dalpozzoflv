
import React from 'react';
import { Card } from '@/components/ui/card';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface ProdutosExtraidosDetailsProps {
  produtosExtraidos: ProdutoExtraido[];
}

const ProdutosExtraidosDetails: React.FC<ProdutosExtraidosDetailsProps> = ({ produtosExtraidos }) => {
  if (produtosExtraidos.length === 0) {
    return null;
  }

  return (
    <details className="mb-6">
      <summary className="cursor-pointer text-lg font-semibold text-gray-700 mb-4">
        Produtos Extraídos ({produtosExtraidos.length}) - Clique para ver detalhes
      </summary>
      <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto space-y-2">
        {produtosExtraidos.map((produto, index) => (
          <Card key={index} className="p-3">
            <div className="font-medium">{produto.fornecedor}</div>
            <div className="text-sm text-gray-600">
              <strong>Produto:</strong> {produto.produto} |
              <strong> Tipo:</strong> {produto.tipo} |
              <strong> Preço:</strong> R$ {produto.preco.toFixed(2)} |
              <strong> Alias:</strong> {produto.aliasUsado}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Original: {produto.linhaOriginal}
            </div>
          </Card>
        ))}
      </div>
    </details>
  );
};

export default ProdutosExtraidosDetails;
