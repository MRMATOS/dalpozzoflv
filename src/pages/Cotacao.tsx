
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { CotacaoValidator, CotacaoMonitor } from '@/utils/cotacaoValidation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useRequisicoes } from '@/hooks/useRequisicoes';
import { useEstoqueVariacoes } from '@/hooks/useEstoqueVariacoes';
import { supabase } from '@/integrations/supabase/client';
import { useCotacao } from '@/hooks/useCotacao';
import FornecedorInput from '@/components/cotacao/FornecedorInput';
import CotacaoRestauradaMessage from '@/components/cotacao/CotacaoRestauradaMessage';
import CotacaoHeader from '@/components/cotacao/CotacaoHeader';
import ProdutosExtraidosDetails from '@/components/cotacao/ProdutosExtraidosDetails';
import GuiaUsoCotacao from '@/components/cotacao/GuiaUsoCotacao';
import AdicionarProdutoModal from '@/components/cotacao/AdicionarProdutoModal';
import CotacaoManualControls from '@/components/cotacao/CotacaoManualControls';
import SystemHealthIndicator from '@/components/cotacao/SystemHealthIndicator';
import { useCotacaoShortcuts } from '@/hooks/useKeyboardShortcuts';

// Lazy loading de componentes pesados para melhor performance
const TabelaComparativa = lazy(() => import('@/components/cotacao/TabelaComparativa'));
const HistoricoPedidos = lazy(() => import('@/components/cotacao/HistoricoPedidos'));

const Cotacao = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { fornecedores } = useFornecedores('cotacao');
  const { requisicoes, lojasComRequisicoes } = useRequisicoes();
  const { obterEstoquesDisplayInteligente } = useEstoqueVariacoes();
  
  const [produtosDB, setProdutosDB] = useState<any[]>([]);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  
  useEffect(() => {
    const buscarProdutos = async () => {
      const startTime = Date.now();
      const { data, error } = await supabase.from('produtos').select('*').eq('ativo', true);
      if (error) console.error('Erro ao buscar produtos:', error);
      else setProdutosDB(data || []);
      CotacaoValidator.monitorPerformance('carregarProdutos', startTime);
    };
    buscarProdutos();
    
    // Iniciar monitoramento de proteção
    CotacaoMonitor.getInstance().startMonitoring();
    
    return () => {
      CotacaoMonitor.getInstance().stopMonitoring();
    };
  }, []);

  const {
    isLoading,
    produtosExtraidos,
    tabelaComparativa,
    fornecedoresProcessados,
    fornecedorSelecionado,
    mensagemAtual,
    cotacaoRestaurada,
    tipoCotacao,
    syncStatus,
    setMensagemAtual,
    selecionarFornecedor,
    processarMensagem,
    handleSalvarRascunho,
    handleRestaurarCotacao,
    handleNovaCotacao,
    atualizarQuantidade,
    atualizarUnidadePedido,
    atualizarPreco,
    calcularPercentualSuprimento,
    retrySync,
    formatLastSyncTime,
    editarProdutoExtraido,
    deletarProdutoExtraido,
    adicionarProdutoManual,
    textosPorFornecedor
  } = useCotacao({ fornecedores, produtosDB, requisicoes });

  // Validação de proteção
  useEffect(() => {
    const hookObject = {
      processarMensagem,
      editarProdutoExtraido,
      deletarProdutoExtraido,
      adicionarProdutoManual,
      atualizarQuantidade,
      atualizarPreco,
      handleSalvarRascunho
    };
    
    if (!CotacaoValidator.validateCriticalFunctions(hookObject)) {
      console.error('🚨 ALERTA: Funcionalidades críticas comprometidas!');
    }
    
    if (!CotacaoValidator.validateExtractionIntegrity(produtosExtraidos)) {
      console.error('🚨 ALERTA: Integridade da extração comprometida!');
    }
  }, [produtosExtraidos, processarMensagem]);

  const fornecedoresComProdutos = [...new Set(produtosExtraidos.map(p => p.fornecedor))];
  const temDados = produtosExtraidos.length > 0 || tabelaComparativa.length > 0;

  const obterEstoquesDisplay = useMemo(() => {
    const cache = new Map<string, React.ReactNode>();
    
    return (produto: string, tipo: string) => {
      const cacheKey = `${produto}|${tipo}`;
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }
      
      const resultado = obterEstoquesDisplayInteligente(produto, tipo);
      cache.set(cacheKey, resultado.jsx);
      return resultado.jsx;
    };
  }, [obterEstoquesDisplayInteligente]);

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

  const handleAdicionarProduto = () => {
    if (fornecedoresComProdutos.length === 0) {
      toast.error('Processe pelo menos um fornecedor antes de adicionar produtos');
      return;
    }
    setModalAdicionarAberto(true);
  };

  const handleProdutoAdicionado = (fornecedor: string, produto: string, tipo: string, preco: number, produtoId?: string) => {
    adicionarProdutoManual(fornecedor, produto, tipo, preco, produtoId);
    setModalAdicionarAberto(false);
  };

  const handleEditarProdutos = () => {
    // Abrir a seção de produtos extraídos para edição
    toast.info('Abra a seção "Produtos Extraídos" abaixo para editar os produtos.');
  };

  const handleLimparTudo = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os produtos extraídos? Esta ação não pode ser desfeita.')) {
      handleNovaCotacao();
    }
  };

  const handleFeedbackEnviado = () => {
    // Opcional: recarregar estatísticas ou mostrar notificação
    toast.success('Feedback registrado! O sistema vai melhorar com sua ajuda.');
  };

  // Atalhos de teclado
  useCotacaoShortcuts({
    onSalvarRascunho: handleSalvarRascunho,
    onRestaurarCotacao: handleRestaurarCotacao,
    onNovaCotacao: handleNovaCotacao,
    onAdicionarProduto: handleAdicionarProduto,
    onVerResumo: irParaResumo,
    onProcessarMensagem: processarMensagem
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Carregando Cotação
            </h2>
            <p className="text-sm text-gray-600">
              Buscando última cotação para continuar de onde parou...
            </p>
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
        onRestaurarCotacao={handleRestaurarCotacao}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calculator className="text-green-600" />
              Cotação de produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="nova-cotacao" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nova-cotacao" className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Nova Cotação
                </TabsTrigger>
                <TabsTrigger value="historico" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Histórico de Pedidos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nova-cotacao" className="space-y-6">
                <div className="text-gray-600 text-sm">
                  Selecione um fornecedor e cole a mensagem que ele enviou no campo abaixo.
                </div>
                
                <FornecedorInput
                  fornecedores={fornecedores}
                  fornecedoresProcessados={fornecedoresProcessados}
                  fornecedorSelecionado={fornecedorSelecionado}
                  mensagemAtual={mensagemAtual}
                  onFornecedorSelect={selecionarFornecedor}
                  onMensagemChange={setMensagemAtual}
                  onProcessar={processarMensagem}
                />

                {cotacaoRestaurada && (
                  <CotacaoRestauradaMessage 
                    dataRestauracao={cotacaoRestaurada} 
                    tipoRestauracao={tipoCotacao || 'rascunho'}
                  />
                )}

                {tabelaComparativa.length > 0 && (
                  <Suspense fallback={<Skeleton className="h-64 w-full" />}>
                    <TabelaComparativa
                      tabela={tabelaComparativa}
                      lojasComRequisicoes={lojasComRequisicoes}
                      fornecedoresComProdutos={fornecedoresComProdutos}
                      temDados={temDados}
                      onCalcularPercentual={calcularPercentualSuprimento}
                      onSalvarRascunho={handleSalvarRascunho}
                      onRestaurar={handleRestaurarCotacao}
                      onNova={handleNovaCotacao}
                      onVerResumo={irParaResumo}
                      onAdicionarProduto={handleAdicionarProduto}
                      onObterEstoques={obterEstoquesDisplay}
                      onQuantidadeChange={atualizarQuantidade}
                      onUnidadeChange={atualizarUnidadePedido}
                      onPrecoChange={atualizarPreco}
                      onCalcularTotal={calcularTotalFornecedor}
                    />
                  </Suspense>
                )}

                {/* Controles Manuais */}
                <CotacaoManualControls
                  produtosExtraidos={produtosExtraidos}
                  fornecedoresComProdutos={fornecedoresComProdutos}
                  onAdicionarProduto={handleAdicionarProduto}
                  onEditarProdutos={handleEditarProdutos}
                  onLimparTudo={handleLimparTudo}
                />
                
                <ProdutosExtraidosDetails 
                  produtosExtraidos={produtosExtraidos}
                  textoOriginalPorFornecedor={textosPorFornecedor}
                  onEditarProduto={editarProdutoExtraido}
                  onDeletarProduto={deletarProdutoExtraido}
                  onFeedbackEnviado={handleFeedbackEnviado}
                />

                <GuiaUsoCotacao />
                
                {/* Indicador de saúde do sistema (apenas em desenvolvimento) */}
                {process.env.NODE_ENV === 'development' && (
                  <SystemHealthIndicator 
                    cotacaoHook={{
                      processarMensagem,
                      editarProdutoExtraido,
                      deletarProdutoExtraido,
                      adicionarProdutoManual,
                      atualizarQuantidade,
                      atualizarPreco,
                      handleSalvarRascunho
                    }}
                    produtosExtraidos={produtosExtraidos}
                  />
                )}
              </TabsContent>

              <TabsContent value="historico">
                <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                  <HistoricoPedidos />
                </Suspense>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <AdicionarProdutoModal
          isOpen={modalAdicionarAberto}
          onClose={() => setModalAdicionarAberto(false)}
          fornecedoresDisponiveis={fornecedoresComProdutos}
          onProdutoAdicionado={handleProdutoAdicionado}
        />
      </main>
    </div>
  );
};

export default Cotacao;
