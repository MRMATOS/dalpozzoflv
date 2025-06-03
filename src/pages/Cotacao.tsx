
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MessageSquare, Trash2, ShoppingCart, Info, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useEstoque } from '@/hooks/useEstoque';

interface ProdutoExtrato {
  nome: string;
  tipo: string;
  preco: number;
  fornecedor: string;
  unidade?: string;
}

interface ProdutoCotacao {
  id: string;
  nome: string;
  tipo: string;
  precos: { [fornecedor: string]: number };
  quantidades: { [fornecedor: string]: number };
  unidades: { [fornecedor: string]: string };
  estoqueLojas: { [loja: string]: { quantidade: number; unidade: string } };
}

const Cotacao = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fornecedores } = useFornecedores();
  const { estoqueProdutos } = useEstoque();
  
  const [mensagensFornecedores, setMensagensFornecedores] = useState<{ [key: string]: string }>({
    'fornecedor1': '',
    'fornecedor2': '',
    'fornecedor3': '',
    'fornecedor4': ''
  });
  const [produtosCotacao, setProdutosCotacao] = useState<ProdutoCotacao[]>([]);
  const [tabAtiva, setTabAtiva] = useState('fornecedor1');

  // Mapear fornecedores cadastrados para as abas
  const fornecedorPorAba = {
    'fornecedor1': fornecedores[0]?.nome || 'Fornecedor 1',
    'fornecedor2': fornecedores[1]?.nome || 'Fornecedor 2', 
    'fornecedor3': fornecedores[2]?.nome || 'Fornecedor 3',
    'fornecedor4': fornecedores[3]?.nome || 'Fornecedor 4'
  };

  const extrairProdutosDaMensagem = (mensagem: string, fornecedor: string) => {
    if (!mensagem.trim()) return [];

    const linhas = mensagem.trim().split('\n');
    const produtosExtraidos: ProdutoExtrato[] = [];

    linhas.forEach(linha => {
      linha = linha.trim();
      if (!linha) return;

      // Regex mais robusta para capturar diferentes formatos de preço
      const regexFormatos = [
        // Formato: "produto R$ 10,50" ou "produto 10,50"
        /^(.+?)(?:\s+(?:R\$?\s*)?(\d+)[,.](\d{2})).*$/,
        // Formato: "R$ 10,50 produto" ou "10,50 produto"  
        /^(?:R\$?\s*)?(\d+)[,.](\d{2})\s+(.+)$/,
        // Formato: "produto: R$ 10,50" ou "produto - 10,50"
        /^(.+?)(?:\s*[:|-]\s*(?:R\$?\s*)?(\d+)[,.](\d{2})).*$/
      ];

      for (const regex of regexFormatos) {
        const match = linha.match(regex);
        if (match) {
          let nome, preco;
          
          if (regex === regexFormatos[1]) {
            // Formato com preço no início
            preco = parseFloat(`${match[1]}.${match[2]}`);
            nome = match[3];
          } else {
            // Formatos com preço no final
            nome = match[1];
            preco = parseFloat(`${match[2]}.${match[3]}`);
          }

          nome = nome.trim().replace(/^[^\w\s]+|[^\w\s]+$/g, '');
          
          if (nome && preco > 0) {
            produtosExtraidos.push({
              nome: nome,
              tipo: nome,
              preco: preco,
              fornecedor: fornecedor,
              unidade: 'Kg'
            });
            break; // Sair do loop quando encontrar um match
          }
        }
      }
    });

    return produtosExtraidos;
  };

  const processarMensagem = () => {
    const mensagem = mensagensFornecedores[tabAtiva];
    const fornecedor = fornecedorPorAba[tabAtiva];

    if (!mensagem.trim()) {
      toast({
        title: "Mensagem vazia",
        description: "Cole a mensagem do fornecedor para extrair os produtos.",
        variant: "destructive"
      });
      return;
    }

    try {
      const produtosExtraidos = extrairProdutosDaMensagem(mensagem, fornecedor);

      if (produtosExtraidos.length === 0) {
        toast({
          title: "Nenhum produto encontrado",
          description: "Não foi possível extrair produtos da mensagem. Verifique o formato.",
          variant: "destructive"
        });
        return;
      }

      integrarProdutos(produtosExtraidos);

      toast({
        title: "Produtos extraídos",
        description: `${produtosExtraidos.length} produtos foram adicionados à cotação.`
      });

    } catch (error) {
      console.error('Erro ao extrair produtos:', error);
      toast({
        title: "Erro na extração",
        description: "Erro ao processar a mensagem.",
        variant: "destructive"
      });
    }
  };

  const integrarProdutos = (produtosExtraidos: ProdutoExtrato[]) => {
    setProdutosCotacao(prev => {
      const novaCotacao = [...prev];

      produtosExtraidos.forEach(produtoExtraido => {
        let produtoExistente = novaCotacao.find(p => 
          p.nome.toLowerCase().includes(produtoExtraido.nome.toLowerCase()) ||
          produtoExtraido.nome.toLowerCase().includes(p.nome.toLowerCase())
        );

        if (!produtoExistente) {
          const estoqueInfo = estoqueProdutos.find(estoque => {
            const nomeNorm = estoque.produto_nome.toLowerCase().trim();
            const produtoNorm = produtoExtraido.nome.toLowerCase().trim();
            return nomeNorm.includes(produtoNorm) || produtoNorm.includes(nomeNorm);
          });

          const estoqueLojas: { [loja: string]: { quantidade: number; unidade: string } } = {};
          
          if (estoqueInfo) {
            Object.entries(estoqueInfo.estoques_por_loja).forEach(([loja, quantidade]) => {
              estoqueLojas[loja] = {
                quantidade: quantidade,
                unidade: estoqueInfo.unidade
              };
            });
          }

          produtoExistente = {
            id: `produto-${Date.now()}-${Math.random()}`,
            nome: produtoExtraido.nome,
            tipo: produtoExtraido.tipo,
            precos: {},
            quantidades: {},
            unidades: {},
            estoqueLojas: estoqueLojas
          };
          novaCotacao.push(produtoExistente);
        }

        produtoExistente.precos[produtoExtraido.fornecedor] = produtoExtraido.preco;
        produtoExistente.quantidades[produtoExtraido.fornecedor] = 0;
        produtoExistente.unidades[produtoExtraido.fornecedor] = produtoExtraido.unidade || 'Kg';
      });

      return novaCotacao;
    });
  };

  const obterMenorPreco = (produto: ProdutoCotacao) => {
    const precos = Object.values(produto.precos);
    return precos.length > 0 ? Math.min(...precos) : 0;
  };

  const calcularTotalFornecedor = (fornecedor: string) => {
    return produtosCotacao.reduce((total, produto) => {
      const preco = produto.precos[fornecedor] || 0;
      const quantidade = produto.quantidades[fornecedor] || 0;
      return total + (preco * quantidade);
    }, 0);
  };

  const gerarResumo = () => {
    const produtosSelecionados = produtosCotacao.filter(produto =>
      Object.values(produto.quantidades).some(qtd => qtd > 0)
    );

    if (produtosSelecionados.length === 0) {
      toast({
        title: "Nenhum produto selecionado",
        description: "Defina quantidades para os produtos desejados.",
        variant: "destructive"
      });
      return;
    }

    navigate('/resumo-pedido', { 
      state: { 
        produtos: produtosSelecionados,
        fornecedores: fornecedores 
      } 
    });
  };

  const limparCotacao = () => {
    setProdutosCotacao([]);
    setMensagensFornecedores({
      'fornecedor1': '',
      'fornecedor2': '',
      'fornecedor3': '',
      'fornecedor4': ''
    });
  };

  const fornecedoresComPrecos = Object.keys(fornecedorPorAba).filter(key =>
    produtosCotacao.some(produto => produto.precos[fornecedorPorAba[key]])
  );

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
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </Button>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Sistema de Cotação de Produtos</h1>
                <p className="text-sm text-gray-500">Comparar preços e criar pedidos</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.tipo}</p>
              </div>
              <Button variant="outline" onClick={signOut} size="sm">
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instruções */}
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Info className="w-5 h-5" />
              <span>Como usar o Sistema de Cotação</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div className="space-y-2">
                <p><strong>1.</strong> Selecione a aba do fornecedor desejado</p>
                <p><strong>2.</strong> Cole a mensagem do WhatsApp na caixa de texto</p>
                <p><strong>3.</strong> Clique em "Processar Mensagem" para extrair produtos</p>
                <p><strong>4.</strong> Repita para outros fornecedores</p>
              </div>
              <div className="space-y-2">
                <p><strong>5.</strong> Compare os preços na tabela abaixo</p>
                <p><strong>6.</strong> Defina as quantidades desejadas</p>
                <p><strong>7.</strong> Verifique os totais por fornecedor</p>
                <p><strong>8.</strong> Clique em "Gerar Pedido" para finalizar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Extração por Fornecedor */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Mensagens dos Fornecedores</span>
            </CardTitle>
            <CardDescription>
              Cole as mensagens do WhatsApp de cada fornecedor nas abas correspondentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="fornecedor1">{fornecedorPorAba['fornecedor1']}</TabsTrigger>
                <TabsTrigger value="fornecedor2">{fornecedorPorAba['fornecedor2']}</TabsTrigger>
                <TabsTrigger value="fornecedor3">{fornecedorPorAba['fornecedor3']}</TabsTrigger>
                <TabsTrigger value="fornecedor4">{fornecedorPorAba['fornecedor4']}</TabsTrigger>
              </TabsList>
              
              {Object.keys(fornecedorPorAba).map(key => (
                <TabsContent key={key} value={key} className="mt-4">
                  <div className="space-y-4">
                    <Textarea
                      value={mensagensFornecedores[key]}
                      onChange={(e) => setMensagensFornecedores(prev => ({
                        ...prev,
                        [key]: e.target.value
                      }))}
                      placeholder={`Cole aqui a mensagem do ${fornecedorPorAba[key]}...`}
                      className="min-h-[120px]"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setMensagensFornecedores(prev => ({
                          ...prev,
                          [key]: ''
                        }))}
                      >
                        Limpar
                      </Button>
                      <Button onClick={processarMensagem}>
                        Processar Mensagem
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Tabela de Cotação */}
        {produtosCotacao.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Comparação de Preços</CardTitle>
                <CardDescription>
                  Compare preços entre fornecedores e defina quantidades
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={limparCotacao}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar Tudo
                </Button>
                <Button onClick={gerarResumo}>
                  Gerar Pedido
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Produto</TableHead>
                      <TableHead className="w-[150px]">Estoques</TableHead>
                      {fornecedoresComPrecos.map(key => {
                        const fornecedor = fornecedorPorAba[key];
                        return (
                          <TableHead key={key} className="text-right min-w-[160px]">
                            <div className="flex flex-col">
                              <span className="font-semibold">{fornecedor}</span>
                              <span className="text-xs text-gray-500">
                                Total: R$ {calcularTotalFornecedor(fornecedor).toFixed(2)}
                              </span>
                            </div>
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosCotacao.map(produto => {
                      const menorPreco = obterMenorPreco(produto);
                      
                      return (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{produto.nome}</div>
                              {produto.tipo !== produto.nome && (
                                <div className="text-sm text-gray-500">{produto.tipo}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {Object.entries(produto.estoqueLojas).map(([loja, estoque]) => (
                                <div key={loja} className="text-xs">
                                  <span className="font-medium">{loja}:</span> {estoque.quantidade} {estoque.unidade}
                                </div>
                              ))}
                              {Object.keys(produto.estoqueLojas).length === 0 && (
                                <span className="text-xs text-gray-400">Sem info</span>
                              )}
                            </div>
                          </TableCell>
                          {fornecedoresComPrecos.map(key => {
                            const fornecedor = fornecedorPorAba[key];
                            const preco = produto.precos[fornecedor];
                            const isMinPrice = preco === menorPreco && menorPreco > 0;
                            
                            return (
                              <TableCell key={key} className="text-right">
                                {preco ? (
                                  <div className="space-y-2">
                                    <div className={`font-semibold ${isMinPrice ? 'text-green-600' : ''}`}>
                                      R$ {preco.toFixed(2)}
                                      {isMinPrice && <Trophy className="inline w-4 h-4 ml-1 text-yellow-500" />}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Select
                                        value={produto.unidades[fornecedor] || 'Kg'}
                                        onValueChange={(unidade) => {
                                          setProdutosCotacao(prev => prev.map(p => 
                                            p.id === produto.id 
                                              ? { ...p, unidades: { ...p.unidades, [fornecedor]: unidade } }
                                              : p
                                          ));
                                        }}
                                      >
                                        <SelectTrigger className="w-16 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Kg">Kg</SelectItem>
                                          <SelectItem value="Caixa">Cx</SelectItem>
                                          <SelectItem value="Unidade">Un</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={produto.quantidades[fornecedor] || ''}
                                        onChange={(e) => {
                                          const quantidade = parseFloat(e.target.value) || 0;
                                          setProdutosCotacao(prev => prev.map(p => 
                                            p.id === produto.id 
                                              ? { ...p, quantidades: { ...p.quantidades, [fornecedor]: quantidade } }
                                              : p
                                          ));
                                        }}
                                        className="w-20 h-8 text-right"
                                        placeholder="0"
                                      />
                                    </div>
                                    {produto.quantidades[fornecedor] > 0 && (
                                      <div className="text-xs text-gray-600">
                                        Subtotal: R$ {(preco * produto.quantidades[fornecedor]).toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Cotacao;
