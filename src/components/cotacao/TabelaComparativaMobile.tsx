
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { ItemTabelaComparativa } from '@/utils/productExtraction/types';
import { normalizarTexto } from '@/lib/utils';
import CotacaoActionButtons from './CotacaoActionButtons';
import FornecedorMobileCard from './FornecedorMobileCard';

interface TabelaComparativaMobileProps {
  tabela: ItemTabelaComparativa[];
  lojasComRequisicoes: string[];
  fornecedoresComProdutos: string[];
  temDados: boolean;
  onCalcularPercentual: (loja: string) => number;
  onSalvarRascunho: () => Promise<boolean>;
  onRestaurar: () => void;
  onNova: () => void;
  onVerResumo: () => void;
  onAdicionarProduto: () => void;
  onObterEstoques: (produto: string, tipo: string) => React.ReactNode;
  onUnidadeChange: (prodIndex: number, forn: string, qtd: string) => void;
  onQuantidadeChange: (prodIndex: number, forn: string, qtd: string) => void;
  onPrecoChange: (prodIndex: number, forn: string, preco: string) => void;
  onCalcularTotal: (fornecedor: string) => number;
}

const TabelaComparativaMobile: React.FC<TabelaComparativaMobileProps> = ({
  tabela,
  lojasComRequisicoes,
  fornecedoresComProdutos,
  temDados,
  onCalcularPercentual,
  onSalvarRascunho,
  onRestaurar,
  onNova,
  onVerResumo,
  onAdicionarProduto,
  onObterEstoques,
  onUnidadeChange,
  onQuantidadeChange,
  onPrecoChange,
  onCalcularTotal,
}) => {
  const [buscaProduto, setBuscaProduto] = useState('');

  const produtosFiltrados = (() => {
    const termoBusca = normalizarTexto(buscaProduto);
    if (!termoBusca) return tabela;
    
    return tabela.filter(item => {
      // Buscar no produto e tipo
      const produtoNormalizado = normalizarTexto(item.produto);
      const tipoNormalizado = normalizarTexto(item.tipo);
      
      if (produtoNormalizado.includes(termoBusca) || tipoNormalizado.includes(termoBusca)) {
        return true;
      }
      
      // Buscar nas descrições originais de todos os fornecedores
      if (item.descricaoOriginal) {
        return Object.values(item.descricaoOriginal).some(descricao => 
          descricao && normalizarTexto(descricao).includes(termoBusca)
        );
      }
      
      return false;
    });
  })();

  const unidadesDisponiveis = ['Caixa', 'Kg', 'Maço', 'Bandeja', 'Unidade', 'Dúzia'];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Comparação de Preços</h2>
      
      {/* Header com busca e botões */}
      <div className="sticky top-0 bg-white z-30 pb-4 border-b mb-4">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar produto..."
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <CotacaoActionButtons
            onSalvarRascunho={onSalvarRascunho}
            onRestaurarCotacao={onRestaurar}
            onNovaCotacao={onNova}
            onVerResumo={onVerResumo}
            onAdicionarProduto={onAdicionarProduto}
            temDados={temDados}
          />
        </div>
      </div>

      {/* Lista de produtos em cards */}
      <div className="space-y-4">
        {produtosFiltrados.map((item, index) => {
          const precos = fornecedoresComProdutos.map(f => item.fornecedores[f]).filter(p => p !== null) as number[];
          const menorPreco = precos.length > 0 ? Math.min(...precos) : null;
          const produtoIndexOriginal = tabela.findIndex(p => p.produto === item.produto && p.tipo === item.tipo);

          return (
            <Card key={`${item.produto}-${item.tipo}`} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Cabeçalho do produto */}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900">{item.produto}</h3>
                  <Badge variant="secondary" className="mt-1">{item.tipo}</Badge>
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="font-medium mb-1">Estoques:</div>
                    {onObterEstoques(item.produto, item.tipo)}
                  </div>
                </div>

                {/* Fornecedores */}
                <div className="space-y-3">
                  {fornecedoresComProdutos.map(fornecedor => {
                    const preco = item.fornecedores[fornecedor];
                    return (
                      <FornecedorMobileCard
                        key={fornecedor}
                        fornecedor={fornecedor}
                        preco={preco}
                        quantidade={item.quantidades[fornecedor] || 0}
                        unidadePedido={item.unidadePedido[fornecedor] || 'Caixa'}
                        isMelhorPreco={preco === menorPreco && preco !== null}
                        opcoesUnidade={unidadesDisponiveis}
                        onQuantidadeChange={(value) => onQuantidadeChange(produtoIndexOriginal, fornecedor, value)}
                        onUnidadeChange={(value) => onUnidadeChange(produtoIndexOriginal, fornecedor, value)}
                        onPrecoChange={(value) => onPrecoChange(produtoIndexOriginal, fornecedor, value)}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Totais por fornecedor */}
      <Card className="mt-6 bg-gray-50">
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-3">Totais por Fornecedor</h3>
          <div className="space-y-2">
            {(() => {
              const totais = fornecedoresComProdutos.map(f => ({ fornecedor: f, total: onCalcularTotal(f) })).filter(t => t.total > 0);
              const menorTotal = totais.length > 0 ? Math.min(...totais.map(t => t.total)) : 0;
              
              return fornecedoresComProdutos.map((fornecedor) => {
                const total = onCalcularTotal(fornecedor);
                const isMelhorTotal = total === menorTotal && total > 0;
                return (
                  <div key={fornecedor} className="flex justify-between items-center py-2 px-3 bg-white rounded-md">
                    <span className="font-medium">{fornecedor}</span>
                    <span className={`font-bold ${isMelhorTotal ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-blue-600'}`}>
                      R$ {total.toFixed(2)}
                      {isMelhorTotal && ' 🏆'}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TabelaComparativaMobile;
