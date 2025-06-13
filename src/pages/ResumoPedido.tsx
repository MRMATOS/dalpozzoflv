
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MessageCircle, FileText, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCotacaoTemporaria } from '@/hooks/useCotacaoTemporaria';
import { useFornecedores } from '@/hooks/useFornecedores';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ResumoPedido = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cotacao, limparCotacao } = useCotacaoTemporaria();
  const { fornecedores } = useFornecedores();
  const [enviandoPedidos, setEnviandoPedidos] = useState<{ [fornecedor: string]: boolean }>({});

  const obterDadosPorFornecedor = () => {
    const dadosPorFornecedor: { [fornecedor: string]: any[] } = {};
    
    cotacao.items.forEach(item => {
      Object.entries(item.fornecedores).forEach(([fornecedor, dados]) => {
        if (dados.selecionado && dados.preco && dados.quantidade) {
          if (!dadosPorFornecedor[fornecedor]) {
            dadosPorFornecedor[fornecedor] = [];
          }
          dadosPorFornecedor[fornecedor].push({
            produto: item.produto,
            tipo: item.tipo,
            quantidade: dados.quantidade,
            preco: dados.preco,
            subtotal: dados.preco * dados.quantidade
          });
        }
      });
    });
    
    return dadosPorFornecedor;
  };

  const calcularTotalFornecedor = (items: any[]) => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  };

  const criarPedidoNoBanco = async (fornecedorNome: string, items: any[], total: number) => {
    try {
      console.log('Criando pedido no banco para:', fornecedorNome);
      console.log('User ID:', user?.id);
      
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar fornecedor
      const fornecedor = fornecedores.find(f => f.nome === fornecedorNome);
      if (!fornecedor) {
        throw new Error(`Fornecedor ${fornecedorNome} não encontrado`);
      }

      // Criar pedido principal
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos_compra')
        .insert({
          fornecedor_id: fornecedor.id,
          total: total,
          status: 'enviado',
          cotacao_id: null,
          user_id: user.id,
          criado_por: user.id
        })
        .select()
        .single();

      if (pedidoError) {
        console.error('Erro ao criar pedido:', pedidoError);
        throw pedidoError;
      }

      console.log('Pedido criado:', pedido);

      // Criar itens do pedido
      const itensParaInserir = items.map(item => ({
        pedido_id: pedido.id,
        produto_id: null, // Vamos precisar buscar o ID do produto
        quantidade: item.quantidade,
        preco: item.preco,
        tipo: item.tipo,
        unidade: 'caixa'
      }));

      const { error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensParaInserir);

      if (itensError) {
        console.error('Erro ao criar itens do pedido:', itensError);
        throw itensError;
      }

      return pedido;
    } catch (error) {
      console.error('Erro ao criar pedido no banco:', error);
      throw error;
    }
  };

  const enviarParaWhatsApp = async (fornecedorNome: string) => {
    const dados = obterDadosPorFornecedor();
    const items = dados[fornecedorNome];
    const total = calcularTotalFornecedor(items);

    setEnviandoPedidos(prev => ({ ...prev, [fornecedorNome]: true }));

    try {
      // Primeiro criar o pedido no banco
      await criarPedidoNoBanco(fornecedorNome, items, total);

      // Montar mensagem do WhatsApp
      let mensagem = `🛒 *PEDIDO - SUPERMERCADO DAL POZZO*\n\n`;
      mensagem += `📞 Fornecedor: ${fornecedorNome}\n`;
      mensagem += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
      mensagem += `📋 *ITENS DO PEDIDO:*\n\n`;

      items.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.produto}`;
        if (item.tipo) {
          mensagem += ` (${item.tipo})`;
        }
        mensagem += `\n   📦 Qtd: ${item.quantidade} caixas\n`;
        mensagem += `   💰 Preço: R$ ${item.preco.toFixed(2)}\n`;
        mensagem += `   💵 Subtotal: R$ ${item.subtotal.toFixed(2)}\n\n`;
      });

      mensagem += `💰 *TOTAL GERAL: R$ ${total.toFixed(2)}*\n\n`;
      mensagem += `✅ Pedido confirmado!\n`;
      mensagem += `📞 Aguardamos confirmação de entrega.`;

      // Buscar telefone do fornecedor
      const fornecedor = fornecedores.find(f => f.nome === fornecedorNome);
      const telefone = fornecedor?.telefone || '';

      // Gerar link do WhatsApp
      const linkWhatsApp = `https://wa.me/${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
      
      // Abrir WhatsApp
      window.open(linkWhatsApp, '_blank');

      toast({
        title: "Pedido enviado!",
        description: `Pedido para ${fornecedorNome} foi criado e enviado via WhatsApp.`
      });

    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      toast({
        title: "Erro ao enviar pedido",
        description: "Não foi possível criar o pedido. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setEnviandoPedidos(prev => ({ ...prev, [fornecedorNome]: false }));
    }
  };

  const gerarPDF = (fornecedorNome: string) => {
    // Implementação do PDF será adicionada posteriormente
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de PDF será implementada em breve.",
    });
  };

  const dadosPorFornecedor = obterDadosPorFornecedor();
  const fornecedoresComPedidos = Object.keys(dadosPorFornecedor);

  if (fornecedoresComPedidos.length === 0) {
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
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">Resumo do Pedido</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum item selecionado</h2>
              <p className="text-gray-500 mb-4">
                Você precisa selecionar itens na cotação antes de gerar pedidos.
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
                onClick={() => navigate('/cotacao')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Package className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Resumo do Pedido</h1>
                <p className="text-sm text-gray-500">Super Dal Pozzo</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {fornecedoresComPedidos.map(fornecedor => {
            const items = dadosPorFornecedor[fornecedor];
            const total = calcularTotalFornecedor(items);
            const enviando = enviandoPedidos[fornecedor];

            return (
              <Card key={fornecedor}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">{fornecedor}</CardTitle>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        R$ {total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {items.length} {items.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.produto}</h4>
                          {item.tipo && (
                            <p className="text-sm text-gray-600">Tipo: {item.tipo}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantidade} cx × R$ {item.preco.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            = R$ {item.subtotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => enviarParaWhatsApp(fornecedor)}
                      disabled={enviando}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {enviando ? 'Enviando...' : 'Enviar WhatsApp'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => gerarPDF(fornecedor)}
                      className="flex-1"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Gerar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Resumo Final</h3>
                  <p className="text-sm text-gray-600">
                    Total de {fornecedoresComPedidos.length} fornecedor(es)
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    R$ {Object.values(dadosPorFornecedor)
                      .flat()
                      .reduce((total, item) => total + item.subtotal, 0)
                      .toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Total geral</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    limparCotacao();
                    navigate('/cotacao');
                  }}
                  className="w-full"
                >
                  Nova Cotação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ResumoPedido;
