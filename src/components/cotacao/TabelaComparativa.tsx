
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { ItemTabelaComparativa } from '@/utils/productExtraction/types';
import { useIsMobile } from '@/hooks/use-mobile';
import CotacaoActionButtons from './CotacaoActionButtons';
import FornecedorCell from './FornecedorCell';
import TabelaComparativaMobile from './TabelaComparativaMobile';

interface TabelaComparativaProps {
  tabela: ItemTabelaComparativa[];
  lojasComRequisicoes: string[];
  fornecedoresComProdutos: string[];
  temDados: boolean;
  onCalcularPercentual: (loja: string) => number;
  onRestaurar: () => void;
  onNova: () => void;
  onVerResumo: () => void;
  onObterEstoques: (produto: string, tipo: string) => React.ReactNode;
  onUnidadeChange: (prodIndex: number, forn: string, unid: string) => void;
  onQuantidadeChange: (prodIndex: number, forn: string, qtd: string) => void;
  onCalcularTotal: (fornecedor: string) => number;
}

const TabelaComparativa: React.FC<TabelaComparativaProps> = (props) => {
  const isMobile = useIsMobile();
  const [buscaProduto, setBuscaProduto] = useState('');
  
  // Se é mobile, renderiza a versão mobile
  if (isMobile) {
    return <TabelaComparativaMobile {...props} />;
  }
  
  // Versão desktop (código original)
  const {
    tabela,
    lojasComRequisicoes,
    fornecedoresComProdutos,
    temDados,
    onCalcularPercentual,
    onRestaurar,
    onNova,
    onVerResumo,
    onObterEstoques,
    onUnidadeChange,
    onQuantidadeChange,
    onCalcularTotal,
  } = props;

  const produtosFiltrados = tabela.filter(item => 
    item.produto.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    item.tipo.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const unidadesDisponiveis = ['Caixa', 'Kg', 'Maço', 'Bandeja', 'Unidade', 'Dúzia'];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Comparação de Preços</h2>
      
      <div className="sticky top-0 bg-white z-30 pb-4 border-b mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-xs w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar produto..."
              value={buscaProduto}
              onChange={(e) => setBuscaProduto(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <CotacaoActionButtons
            onRestaurarCotacao={onRestaurar}
            onNovaCotacao={onNova}
            onVerResumo={onVerResumo}
            temDados={temDados}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white relative">
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full min-w-max table-fixed">
            <thead className="sticky top-[0px] bg-gray-50 z-20 border-b">
              <tr>
                <th className="w-[100px] min-w-[100px] p-3 text-left font-medium text-muted-foreground border-r">Produto</th>
                <th className="w-[150px] min-w-[150px] p-3 text-left font-medium text-muted-foreground border-r">Tipo</th>
                <th className="w-[160px] min-w-[160px] p-3 text-left font-medium text-muted-foreground border-r">Estoques</th>
                {fornecedoresComProdutos.map((fornecedor, index) => (
                  <th key={fornecedor} className={`w-[100px] min-w-[100px] p-3 font-medium text-muted-foreground text-center ${index < fornecedoresComProdutos.length - 1 ? 'border-r' : ''}`}>
                    {fornecedor}
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white">
              {produtosFiltrados.map((item, index) => {
                const precos = fornecedoresComProdutos.map(f => item.fornecedores[f]).filter(p => p !== null) as number[];
                const menorPreco = precos.length > 0 ? Math.min(...precos) : null;
                const produtoIndexOriginal = tabela.findIndex(p => p.produto === item.produto && p.tipo === item.tipo);

                return (
                  <tr key={`${item.produto}-${item.tipo}`} className="border-b last:border-b-0 hover:bg-gray-50">
                    <td className="w-[100px] min-w-[100px] p-3 font-medium border-r"><span className="truncate block">{item.produto}</span></td>
                    <td className="w-[150px] min-w-[150px] p-3 border-r"><Badge variant="secondary" className="truncate max-w-full">{item.tipo}</Badge></td>
                    <td className="w-[160px] min-w-[160px] p-3 border-r">{onObterEstoques(item.produto, item.tipo)}</td>
                    {fornecedoresComProdutos.map(fornecedor => {
                      const preco = item.fornecedores[fornecedor];
                      return (
                        <FornecedorCell
                          key={fornecedor}
                          preco={preco}
                          quantidade={item.quantidades[fornecedor] || 0}
                          unidadePedido={item.unidadePedido[fornecedor] || 'Caixa'}
                          isMelhorPreco={preco === menorPreco && preco !== null}
                          opcoesUnidade={unidadesDisponiveis}
                          onQuantidadeChange={(value) => onQuantidadeChange(produtoIndexOriginal, fornecedor, value)}
                          onUnidadeChange={(value) => onUnidadeChange(produtoIndexOriginal, fornecedor, value)}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            
            <tfoot className="sticky bottom-0 bg-gray-100 border-t-2 z-10">
              <tr className="font-semibold">
                <td className="w-[100px] min-w-[100px] p-3 border-r">TOTAL GERAL</td>
                <td className="w-[150px] min-w-[150px] p-3 border-r"></td>
                <td className="w-[160px] min-w-[160px] p-3 border-r"></td>
                {(() => {
                  const totais = fornecedoresComProdutos.map(f => onCalcularTotal(f)).filter(t => t > 0);
                  const menorTotal = totais.length > 0 ? Math.min(...totais) : 0;
                  
                  return fornecedoresComProdutos.map((fornecedor, fornIndex) => {
                    const total = onCalcularTotal(fornecedor);
                    const isMelhorTotal = total === menorTotal && total > 0;
                    return (
                      <td key={fornecedor} className={`w-[100px] min-w-[100px] p-3 text-center ${fornIndex < fornecedoresComProdutos.length - 1 ? 'border-r' : ''}`}>
                        <div className={`text-base font-bold ${isMelhorTotal ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-blue-600'}`}>
                          R$ {total.toFixed(2)}
                          {isMelhorTotal && ' 🏆'}
                        </div>
                      </td>
                    );
                  });
                })()}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TabelaComparativa;
