
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useRequisicoes } from '@/hooks/useRequisicoes';
import { useEstoque } from '@/hooks/useEstoque';
import { supabase } from '@/integrations/supabase/client';
import { useCotacao } from '@/hooks/useCotacao';
import FornecedorInput from '@/components/cotacao/FornecedorInput';
import TabelaComparativa from '@/components/cotacao/TabelaComparativa';
import CotacaoRestauradaMessage from '@/components/cotacao/CotacaoRestauradaMessage';
import CotacaoHeader from '@/components/cotacao/CotacaoHeader';
import ProdutosExtraidosDetails from '@/components/cotacao/ProdutosExtraidosDetails';
import GuiaUsoCotacao from '@/components/cotacao/GuiaUsoCotacao';

const Cotacao = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { fornecedores } = useFornecedores();
  const { requisicoes, lojasComRequisicoes } = useRequisicoes();
  const { obterEstoqueProduto } = useEstoque();
  
  const [produtosDB, setProdutosDB] = useState<any[]>([]);
  
  useEffect(() => {
    const buscarProdutos = async () => {
      const { data, error } = await supabase.from('produtos').select('*').eq('ativo', true);
      if (error) console.error('Erro ao buscar produtos:', error);
      else setProdutosDB(data || []);
    };
    buscarProdutos();
  }, []);

  const {
    isLoading,
    produtosExtraidos,
    tabelaComparativa,
    fornecedoresProcessados,
    fornecedorSelecionado,
    mensagemAtual,
    cotacaoRestaurada,
    syncStatus,
    isProcessing,
    setMensagemAtual,
    selecionarFornecedor,
    processarMensagem,
    handleRestaurarCotacao,
    handleNovaCotacao,
    atualizarQuantidade,
    atualizarUnidadePedido,
    calcularPercentualSuprimento,
    retrySync,
    formatLastSyncTime,
  } = useCotacao({ fornecedores, produtosDB, requisicoes });

  const fornecedoresComProdutos = [...new Set(produtosExtraidos.map(p => p.fornecedor))];
  const temDados = produtosExtraidos.length > 0 || tabelaComparativa.length > 0;

  const obterEstoquesDisplay = (produto: string, tipo: string) => {
    const estoque = obterEstoqueProduto(produto, tipo);
    if (!estoque || Object.keys(estoque.estoques_por_loja).length === 0) {
      return <div className="text-gray-400 text-sm">Sem estoque</div>;
    }
    const lojas = Object.entries(estoque.estoques_por_loja);
    const unidadeEstoque = estoque.unidade;
    return (
      <div className="text-sm space-y-1">
        {lojas.map(([loja, quantidade]) => (
          <div key={loja} className="text-gray-600">
            {loja}: <span className="font-medium">{quantidade}</span> {unidadeEstoque.toLowerCase()}
          </div>
        ))}
        <div className="font-semibold text-gray-800 border-t pt-1">
          Total: {estoque.total_estoque} {unidadeEstoque.toLowerCase()}
        </div>
      </div>
    );
  };

  const calcularTotalFornecedor = (fornecedor: string) => {
    return tabelaComparativa.reduce((total, item) => {
      const preco = item.fornecedores[fornecedor];
      const quantidade = item.quantidades[fornecedor] || 0;
      return total + (preco !== null ? preco : 0) * quantidade;
    }, 0);
  };

  const irParaResumo = () => {
    const temProdutosComQuantidade = tabelaComparativa.some(item => 
      Object.values(item.quantidades || {}).some(quantidade => quantidade > 0)
    );
    if (!temProdutosComQuantidade) {
      toast.error('Defina as quantidades dos produtos antes de gerar o resumo');
      return;
    }
    navigate('/resumo-pedido', { state: { tabelaComparativa } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Carregando Cotação</h2>
            <p className="text-sm text-gray-600">Verificando cotações em andamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CotacaoHeader 
        profile={profile} 
        syncStatus={syncStatus}
        formatLastSyncTime={formatLastSyncTime}
        onRetrySync={retrySync}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calculator className="text-green-600" />
              Sistema de Cotação de Produtos
            </CardTitle>
            <p className="text-gray-600">
              Cole as mensagens dos fornecedores do WhatsApp para comparar preços automaticamente
            </p>
          </CardHeader>
          <CardContent>
            <FornecedorInput
              fornecedores={fornecedores}
              fornecedoresProcessados={fornecedoresProcessados}
              fornecedorSelecionado={fornecedorSelecionado}
              mensagemAtual={mensagemAtual}
              isProcessing={isProcessing}
              onFornecedorSelect={selecionarFornecedor}
              onMensagemChange={setMensagemAtual}
              onProcessar={processarMensagem}
            />

            {cotacaoRestaurada && (
              <CotacaoRestauradaMessage dataRestauracao={cotacaoRestaurada} />
            )}

            {tabelaComparativa.length > 0 && (
              <TabelaComparativa
                tabela={tabelaComparativa}
                lojasComRequisicoes={lojasComRequisicoes}
                fornecedoresComProdutos={fornecedoresComProdutos}
                temDados={temDados}
                onCalcularPercentual={calcularPercentualSuprimento}
                onRestaurar={handleRestaurarCotacao}
                onNova={handleNovaCotacao}
                onVerResumo={irParaResumo}
                onObterEstoques={obterEstoquesDisplay}
                onQuantidadeChange={atualizarQuantidade}
                onUnidadeChange={atualizarUnidadePedido}
                onCalcularTotal={calcularTotalFornecedor}
              />
            )}
            
            <ProdutosExtraidosDetails produtosExtraidos={produtosExtraidos} />

            <GuiaUsoCotacao />
            
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Cotacao;
