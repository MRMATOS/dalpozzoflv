
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calculator, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useRequisicoes } from '@/hooks/useRequisicoes';
import { useEstoque } from '@/hooks/useEstoque';
import { supabase } from '@/integrations/supabase/client';
import { useCotacao } from '@/hooks/useCotacao';
import FornecedorInput from '@/components/cotacao/FornecedorInput';
import TabelaComparativa from '@/components/cotacao/TabelaComparativa';
import CotacaoRestauradaMessage from '@/components/cotacao/CotacaoRestauradaMessage';

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
    salvandoAutomaticamente,
    setMensagemAtual,
    selecionarFornecedor,
    processarMensagem,
    handleRestaurarCotacao,
    handleNovaCotacao,
    atualizarQuantidade,
    atualizarUnidadePedido,
    calcularPercentualSuprimento,
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Nova Cotação</h1>
                <p className="text-sm text-gray-500">Sistema FLV</p>
              </div>
              {salvandoAutomaticamente && (
                <div className="flex items-center text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Salvando...
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <p className="text-xs text-gray-500">Comprador</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
            
            {produtosExtraidos.length > 0 && (
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
            )}

            <Card className="bg-blue-50 border-l-4 border-blue-500">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
                <ol className="text-blue-700 text-sm space-y-1">
                  <li>1. Clique em um fornecedor para selecioná-lo (botão fica azul)</li>
                  <li>2. Cole a mensagem do WhatsApp na área de texto</li>
                  <li>3. Clique em "Processar Mensagem" (botão do fornecedor fica verde)</li>
                  <li>4. Repita para outros fornecedores</li>
                  <li>5. Use a busca para encontrar produtos rapidamente</li>
                  <li>6. Insira as quantidades desejadas para cada produto</li>
                  <li>7. Compare os totais por fornecedor na última linha</li>
                  <li>8. Clique em "Ver Resumo" para gerar os pedidos</li>
                </ol>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Cotacao;
