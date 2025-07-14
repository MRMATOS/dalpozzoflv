import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search } from 'lucide-react';
import { ItemTabelaComparativa } from '@/utils/productExtraction/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { normalizarTexto } from '@/lib/utils';
import CotacaoActionButtons from './CotacaoActionButtons';
import FornecedorCell from './FornecedorCell';
import TabelaComparativaMobile from './TabelaComparativaMobile';
import EstoqueDisplay from './EstoqueDisplay';

interface TabelaComparativaProps {
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
  onUnidadeChange: (prodIndex: number, forn: string, unid: string) => void;
  onQuantidadeChange: (prodIndex: number, forn: string, qtd: string) => void;
  onPrecoChange: (prodIndex: number, forn: string, preco: string) => void;
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
    onSalvarRascunho,
    onRestaurar,
    onNova,
    onVerResumo,
    onObterEstoques,
    onUnidadeChange,
    onQuantidadeChange,
    onPrecoChange,
    onCalcularTotal,
  } = props;

  const produtosFiltrados = useMemo(() => {
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
  }, [tabela, buscaProduto]);

  const unidadesDisponiveis = ['Bandeja', 'Caixa', 'Gaiola', 'Kg', 'Maço', 'Pacote', 'Saco', 'Unidade'];

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
            onSalvarRascunho={onSalvarRascunho}
            onRestaurarCotacao={onRestaurar}
            onNovaCotacao={onNova}
            onVerResumo={onVerResumo}
            onAdicionarProduto={props.onAdicionarProduto}
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
                    <td className="w-[150px] min-w-[150px] p-3 border-r">
                      <div className="space-y-1">
                        <Badge variant="secondary" className="truncate max-w-full block">{item.tipo}</Badge>
                        {/* Mostrar descrições originais dos fornecedores */}
                        {item.descricaoOriginal && Object.entries(item.descricaoOriginal).some(([_, desc]) => desc.trim()) && (
                          <TooltipProvider>
                            <div className="space-y-0.5">
                              {Object.entries(item.descricaoOriginal)
                                .filter(([fornecedor, descricao]) => descricao.trim() && item.fornecedores[fornecedor] !== null)
                                .map(([fornecedor, descricao]) => (
                                  <Tooltip key={fornecedor}>
                                    <TooltipTrigger asChild>
                                      <div className="text-xs text-gray-600 truncate cursor-help border-l-2 border-gray-300 pl-2">
                                        <span className="font-medium text-blue-600">{fornecedor.substring(0, 3)}:</span> {descricao}
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="left" className="max-w-xs">
                                      <div className="text-sm">
                                        <div className="font-semibold text-blue-600 mb-1">{fornecedor}:</div>
                                        <div>{descricao}</div>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                ))}
                            </div>
                          </TooltipProvider>
                        )}
                      </div>
                    </td>
                    <td className="w-[160px] min-w-[160px] p-3 border-r">
                      <EstoqueDisplay 
                        produto={item.produto} 
                        tipo={item.tipo} 
                        onObterEstoques={onObterEstoques} 
                      />
                    </td>
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
                          onPrecoChange={(value) => onPrecoChange(produtoIndexOriginal, fornecedor, value)}
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
