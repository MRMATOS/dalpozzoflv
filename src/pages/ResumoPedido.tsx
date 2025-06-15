import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Package, Loader2 } from 'lucide-react';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useAuth } from '@/contexts/AuthContext';
import { useCotacaoPersistence } from '@/hooks/useCotacaoPersistence';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ItemTabelaComparativa {
  produto: string;
  tipo: string;
  fornecedores: { [fornecedor: string]: number | null };
  quantidades: { [fornecedor: string]: number };
  unidadePedido: { [fornecedor: string]: string };
}

interface ResumoFornecedor {
  fornecedor: string;
  itens: {
    produto: string;
    tipo: string;
    quantidade: number;
    preco: number;
    subtotal: number;
    unidade: string;
  }[];
  total: number;
}

const ResumoPedido = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fornecedores } = useFornecedores();
  const { user } = useAuth();
  const { marcarComoEnviada } = useCotacaoPersistence();
  const [loadingWhatsApp, setLoadingWhatsApp] = useState<string | null>(null);
  
  // Receber os dados da tabela comparativa
  const tabelaComparativa: ItemTabelaComparativa[] = location.state?.tabelaComparativa || [];
  const isHistorico = location.state?.isHistorico || false;

  // Função para pluralizar unidades
  const pluralizarUnidade = (unidade: string, quantidade: number): string => {
    if (quantidade === 1) {
      return unidade;
    }

    const pluralizacao: { [key: string]: string } = {
      'Caixa': 'Caixas',
      'Dúzia': 'Dúzias',
      'Unidade': 'Unidades',
      'Bandeja': 'Bandejas',
      'Maço': 'Maços',
      'Kg': 'Kg'
    };

    return pluralizacao[unidade] || unidade;
  };

  // Função para formatar telefone brasileiro
  const formatarTelefoneBrasil = (telefone: string): string => {
    // Remove todos os caracteres não numéricos
    const apenasNumeros = telefone.replace(/\D/g, '');
    
    // Se já tem código do país (55), retorna como está
    if (apenasNumeros.startsWith('55') && apenasNumeros.length >= 12) {
      return apenasNumeros;
    }
    
    // Se é um número brasileiro sem código do país, adiciona 55
    if (apenasNumeros.length >= 10) {
      return '55' + apenasNumeros;
    }
    
    throw new Error('Telefone inválido');
  };

  // Função para validar telefone
  const validarTelefone = (telefone: string): boolean => {
    try {
      const telefoneFormatado = formatarTelefoneBrasil(telefone);
      // Telefone brasileiro deve ter 13 dígitos (55 + DDD + número)
      return telefoneFormatado.length >= 12 && telefoneFormatado.length <= 14;
    } catch {
      return false;
    }
  };

  // Processar dados para criar resumo por fornecedor
  const resumoFornecedores: ResumoFornecedor[] = React.useMemo(() => {
    const resumo: { [fornecedor: string]: ResumoFornecedor } = {};

    tabelaComparativa.forEach(item => {
      Object.entries(item.quantidades || {}).forEach(([fornecedor, quantidade]) => {
        if (quantidade > 0 && item.fornecedores?.[fornecedor] !== null && item.fornecedores?.[fornecedor] !== undefined) {
          const preco = item.fornecedores[fornecedor]!;
          const subtotal = quantidade * preco;
          const unidade = item.unidadePedido?.[fornecedor] || 'Caixa';

          if (!resumo[fornecedor]) {
            resumo[fornecedor] = {
              fornecedor,
              itens: [],
              total: 0
            };
          }

          resumo[fornecedor].itens.push({
            produto: item.produto,
            tipo: item.tipo,
            quantidade,
            preco,
            subtotal,
            unidade
          });

          resumo[fornecedor].total += subtotal;
        }
      });
    });

    return Object.values(resumo);
  }, [tabelaComparativa]);

  const gerarMensagemWhatsApp = (resumoFornecedor: ResumoFornecedor) => {
    let mensagem = `PEDIDO DE COMPRA\n\n`;

    resumoFornecedor.itens.forEach((item, index) => {
      const unidadePlural = pluralizarUnidade(item.unidade, item.quantidade);
      
      mensagem += `${index + 1}. ${item.produto} - ${item.tipo}\n`;
      mensagem += `   ${item.quantidade} ${unidadePlural} x R$ ${item.preco.toFixed(2)}\n`;
      mensagem += `   Subtotal: R$ ${item.subtotal.toFixed(2)}\n\n`;
    });

    mensagem += `TOTAL: R$ ${resumoFornecedor.total.toFixed(2)}\n\n`;
    mensagem += `Obrigado!`;

    return encodeURIComponent(mensagem);
  };

  // Versão simplificada da criação de pedido
  const criarPedidoNoBanco = async (resumoFornecedor: ResumoFornecedor) => {
    console.log('=== INÍCIO CRIAÇÃO PEDIDO SIMPLIFICADA ===');
    console.log('User atual:', user);
    console.log('Resumo fornecedor:', resumoFornecedor);
    
    if (!user?.id) {
      console.error('Erro: Usuário não autenticado');
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      console.log('Buscando fornecedor:', resumoFornecedor.fornecedor);
      const fornecedorData = fornecedores.find(f => f.nome === resumoFornecedor.fornecedor);
      
      if (!fornecedorData) {
        console.error('Fornecedor não encontrado:', resumoFornecedor.fornecedor);
        toast.error('Fornecedor não encontrado');
        return false;
      }

      console.log('Fornecedor encontrado:', fornecedorData);

      // Buscar produtos diretamente
      console.log('Buscando IDs dos produtos...');
      const nomesProdutos = resumoFornecedor.itens.map(item => item.produto);
      console.log('Nomes dos produtos:', nomesProdutos);

      const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('id, produto')
        .in('produto', nomesProdutos);

      if (produtosError) {
        console.error('Erro ao buscar produtos:', produtosError);
        toast.error('Erro ao buscar produtos no sistema');
        return false;
      }

      console.log('Produtos encontrados:', produtos);

      const mapeamentoProdutos: { [nome: string]: string } = {};
      produtos?.forEach(produto => {
        if (produto.produto) {
          mapeamentoProdutos[produto.produto] = produto.id;
        }
      });

      const produtosNaoEncontrados = nomesProdutos.filter(nome => !mapeamentoProdutos[nome]);
      if (produtosNaoEncontrados.length > 0) {
        console.error('Produtos não encontrados:', produtosNaoEncontrados);
        toast.error(`Produtos não encontrados: ${produtosNaoEncontrados.join(', ')}`);
        return false;
      }

      // Criar pedido diretamente com Supabase
      console.log('Criando pedido diretamente...');
      const dadosPedido = {
        user_id: user.id,
        fornecedor_id: fornecedorData.id,
        total: resumoFornecedor.total,
        status: 'enviado'
      };

      console.log('Dados do pedido:', dadosPedido);

      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_compra')
        .insert(dadosPedido)
        .select()
        .single();

      if (pedidoError) {
        console.error('Erro ao criar pedido:', pedidoError);
        toast.error('Erro ao criar pedido: ' + pedidoError.message);
        return false;
      }

      console.log('Pedido criado com sucesso:', pedido);

      // Criar itens do pedido diretamente
      console.log('Criando itens do pedido...');
      const itens = resumoFornecedor.itens.map(item => ({
        pedido_id: pedido.id,
        produto_id: mapeamentoProdutos[item.produto],
        tipo: item.tipo,
        quantidade: item.quantidade,
        preco: item.preco,
        unidade: item.unidade
      }));

      console.log('Itens a serem inseridos:', itens);

      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itens);

      if (itensError) {
        console.error('Erro ao inserir itens:', itensError);
        toast.error('Erro ao inserir itens do pedido: ' + itensError.message);
        return false;
      }

      console.log('=== PEDIDO CRIADO COM SUCESSO ===');
      return true;
    } catch (error) {
      console.error('=== ERRO GERAL NA CRIAÇÃO DO PEDIDO ===');
      console.error('Erro completo:', error);
      toast.error('Erro inesperado ao salvar pedido');
      return false;
    }
  };

  const abrirWhatsApp = async (resumoFornecedor: ResumoFornecedor) => {
    console.log('=== INÍCIO PROCESSO WHATSAPP ===');
    setLoadingWhatsApp(resumoFornecedor.fornecedor);
    
    try {
      const fornecedorData = fornecedores.find(f => f.nome === resumoFornecedor.fornecedor);
      
      if (!fornecedorData?.telefone) {
        toast.error('Telefone do fornecedor não encontrado!');
        return;
      }

      // Validar telefone antes de continuar
      if (!validarTelefone(fornecedorData.telefone)) {
        toast.error('Telefone do fornecedor está em formato inválido!');
        return;
      }

      if (!isHistorico) {
        console.log('Criando pedido no banco...');
        const pedidoCriado = await criarPedidoNoBanco(resumoFornecedor);
        if (!pedidoCriado) {
          console.log('Falha ao criar pedido, interrompendo processo');
          return;
        }

        if (marcarComoEnviada) {
          console.log('Marcando cotação como enviada...');
          await marcarComoEnviada();
        }
      }

      const telefoneFormatado = formatarTelefoneBrasil(fornecedorData.telefone);
      const mensagem = gerarMensagemWhatsApp(resumoFornecedor);
      
      // Usar wa.me que é mais confiável
      const link = `https://wa.me/${telefoneFormatado}?text=${mensagem}`;
      
      console.log('Abrindo WhatsApp com telefone:', telefoneFormatado);
      window.open(link, '_blank');
      
      if (!isHistorico) {
        toast.success('Pedido salvo e enviado com sucesso!');
      } else {
        toast.success('Mensagem do WhatsApp gerada!');
      }
      
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      toast.error('Erro ao gerar mensagem do WhatsApp');
    } finally {
      setLoadingWhatsApp(null);
      console.log('=== PROCESSO WHATSAPP CONCLUÍDO ===');
    }
  };

  if (resumoFornecedores.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/cotacao')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Resumo do Pedido</h1>
                  <p className="text-sm text-gray-500">Sistema FLV</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum item selecionado</h2>
              <p className="text-gray-600 mb-4">
                Volte para a cotação e defina as quantidades dos produtos que deseja comprar.
              </p>
              <Button onClick={() => navigate('/cotacao')}>
                Voltar para Cotação
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(isHistorico ? '/historico-pedidos' : '/cotacao')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {isHistorico ? 'Detalhes do Pedido' : 'Resumo do Pedido'}
                </h1>
                <p className="text-sm text-gray-500">Sistema FLV</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {resumoFornecedores.map((resumoFornecedor, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-3">
                    <Package className="text-blue-600" />
                    {resumoFornecedor.fornecedor}
                  </CardTitle>
                  {!isHistorico && (
                    <Button
                      onClick={() => abrirWhatsApp(resumoFornecedor)}
                      disabled={loadingWhatsApp === resumoFornecedor.fornecedor}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {loadingWhatsApp === resumoFornecedor.fornecedor ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Gerar pedido por WhatsApp
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resumoFornecedor.itens.map((item, itemIndex) => {
                    const unidadePlural = pluralizarUnidade(item.unidade, item.quantidade);
                    
                    return (
                      <div key={itemIndex} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{item.produto}</h3>
                            <Badge variant="secondary">{item.tipo}</Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Quantidade:</span> {item.quantidade} {unidadePlural}
                            </div>
                            <div>
                              <span className="font-medium">Preço unitário:</span> R$ {item.preco.toFixed(2)}
                            </div>
                            <div>
                              <span className="font-medium">Subtotal:</span> R$ {item.subtotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total geral:</span>
                      <span className="text-xl font-bold text-blue-600">
                        R$ {resumoFornecedor.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ResumoPedido;
