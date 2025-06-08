
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Package } from 'lucide-react';
import { useFornecedores } from '@/hooks/useFornecedores';

interface ItemTabelaComparativa {
  produto: string;
  tipo: string;
  fornecedores: { [fornecedor: string]: number | null };
  quantidades: { [fornecedor: string]: number };
  unidadesPedido: { [fornecedor: string]: string };
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
  
  // Receber os dados da tabela comparativa
  const tabelaComparativa: ItemTabelaComparativa[] = location.state?.tabelaComparativa || [];

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
      'Kg': 'Kg' // Kg não muda no plural
    };

    return pluralizacao[unidade] || unidade;
  };

  // Processar dados para criar resumo por fornecedor
  const resumoFornecedores: ResumoFornecedor[] = React.useMemo(() => {
    const resumo: { [fornecedor: string]: ResumoFornecedor } = {};

    tabelaComparativa.forEach(item => {
      Object.entries(item.quantidades).forEach(([fornecedor, quantidade]) => {
        if (quantidade > 0 && item.fornecedores[fornecedor] !== null) {
          const preco = item.fornecedores[fornecedor]!;
          const subtotal = quantidade * preco;
          const unidade = item.unidadesPedido[fornecedor] || 'Caixa';

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
    let mensagem = `Segue o pedido de compra com os itens selecionados:\n\n`;

    resumoFornecedor.itens.forEach(item => {
      const unidadePlural = pluralizarUnidade(item.unidade, item.quantidade);
      
      mensagem += `Produto: ${item.produto}\n`;
      mensagem += `Tipo: ${item.tipo}\n`;
      mensagem += `Quantidade: ${item.quantidade} ${unidadePlural}\n`;
      mensagem += `Preço unitário: R$ ${item.preco.toFixed(2)}\n`;
      mensagem += `Subtotal: R$ ${item.subtotal.toFixed(2)}\n\n`;
    });

    mensagem += `Total geral: R$ ${resumoFornecedor.total.toFixed(2)}`;

    return encodeURIComponent(mensagem);
  };

  const abrirWhatsApp = (resumoFornecedor: ResumoFornecedor) => {
    const fornecedorData = fornecedores.find(f => f.nome === resumoFornecedor.fornecedor);
    
    if (!fornecedorData?.telefone) {
      alert('Telefone do fornecedor não encontrado!');
      return;
    }

    const mensagem = gerarMensagemWhatsApp(resumoFornecedor);
    const telefone = fornecedorData.telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
    const link = `https://api.whatsapp.com/send?phone=${telefone}&text=${mensagem}`;
    
    window.open(link, '_blank');
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
      {/* Header */}
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

      {/* Main Content */}
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
                  <Button
                    onClick={() => abrirWhatsApp(resumoFornecedor)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Gerar pedido por WhatsApp
                  </Button>
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
                  
                  {/* Total do Fornecedor */}
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
