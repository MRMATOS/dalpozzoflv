
import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MessageSquare, Trash2, ShoppingCart, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useEstoque } from '@/hooks/useEstoque';

interface ProdutoExtrato {
  nome: string;
  tipo: string;
  preco: number;
  fornecedor: string;
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
  
  const [mensagemFornecedor, setMensagemFornecedor] = useState('');
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState('');
  const [produtosCotacao, setProdutosCotacao] = useState<ProdutoCotacao[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const extrairProdutos = () => {
    if (!mensagemFornecedor.trim() || !fornecedorSelecionado) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um fornecedor e cole a mensagem.",
        variant: "destructive"
      });
      return;
    }

    try {
      const linhas = mensagemFornecedor.trim().split('\n');
      const produtosExtraidos: ProdutoExtrato[] = [];

      linhas.forEach(linha => {
        linha = linha.trim();
        if (!linha) return;

        // Tentar extrair preço da linha (formatos: R$ 10,50 ou 10,50 ou 10.50)
        const precoRegex = /(?:R\$\s*)?(\d+)[,.](\d{2})/;
        const precoMatch = linha.match(precoRegex);
        
        if (precoMatch) {
          const preco = parseFloat(`${precoMatch[1]}.${precoMatch[2]}`);
          
          // Remover o preço da linha para extrair o nome do produto
          const nomeProduto = linha
            .replace(precoRegex, '')
            .replace(/^\W+|\W+$/g, '') // Remove caracteres especiais do início e fim
            .trim();

          if (nomeProduto) {
            produtosExtraidos.push({
              nome: nomeProduto,
              tipo: nomeProduto, // Por enquanto, tipo = nome
              preco: preco,
              fornecedor: fornecedorSelecionado
            });
          }
        }
      });

      if (produtosExtraidos.length === 0) {
        toast({
          title: "Nenhum produto encontrado",
          description: "Não foi possível extrair produtos da mensagem.",
          variant: "destructive"
        });
        return;
      }

      // Integrar produtos extraídos na cotação
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
        // Buscar se já existe um produto similar
        let produtoExistente = novaCotacao.find(p => 
          p.nome.toLowerCase().includes(produtoExtraido.nome.toLowerCase()) ||
          produtoExtraido.nome.toLowerCase().includes(p.nome.toLowerCase())
        );

        if (!produtoExistente) {
          // Buscar informações de estoque na lista de produtos
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

          // Criar novo produto
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

        // Adicionar preço do fornecedor
        produtoExistente.precos[produtoExtraido.fornecedor] = produtoExtraido.preco;
        produtoExistente.quantidades[produtoExtraido.fornecedor] = 0;
        produtoExistente.unidades[produtoExtraido.fornecedor] = 'Kg';
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

    // Navegar para página de resumo (implementar state management se necessário)
    navigate('/resumo-pedido', { 
      state: { 
        produtos: produtosSelecionados,
        fornecedores: fornecedores 
      } 
    });
  };

  const fornecedoresAtivos = fornecedores.filter(f => f.nome);
  const fornecedoresComPrecos = fornecedoresAtivos.filter(fornecedor =>
    produtosCotacao.some(produto => produto.precos[fornecedor.nome])
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
                <h1 className="text-lg font-semibold text-gray-900">Cotação de Preços</h1>
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
        {/* Seção de Extração */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Extrair Produtos de Mensagem</span>
            </CardTitle>
            <CardDescription>
              Cole a mensagem do fornecedor para extrair produtos e preços automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <Select value={fornecedorSelecionado} onValueChange={setFornecedorSelecionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {fornecedoresAtivos.map(fornecedor => (
                      <SelectItem key={fornecedor.id} value={fornecedor.nome}>
                        {fornecedor.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensagem do Fornecedor
                </label>
                <Textarea
                  ref={textareaRef}
                  value={mensagemFornecedor}
                  onChange={(e) => setMensagemFornecedor(e.target.value)}
                  placeholder="Cole aqui a mensagem do fornecedor com produtos e preços..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setMensagemFornecedor('');
                  setFornecedorSelecionado('');
                }}
              >
                Limpar
              </Button>
              <Button onClick={extrairProdutos}>
                Extrair Produtos
              </Button>
            </div>
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
                <Button 
                  variant="outline" 
                  onClick={() => setProdutosCotacao([])}
                >
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
                      {fornecedoresComPrecos.map(fornecedor => (
                        <TableHead key={fornecedor.id} className="text-right min-w-[160px]">
                          <div className="flex flex-col">
                            <span className="font-semibold">{fornecedor.nome}</span>
                            <span className="text-xs text-gray-500">
                              Total: R$ {calcularTotalFornecedor(fornecedor.nome).toFixed(2)}
                            </span>
                          </div>
                        </TableHead>
                      ))}
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
                          {fornecedoresComPrecos.map(fornecedor => {
                            const preco = produto.precos[fornecedor.nome];
                            const isMinPrice = preco === menorPreco && menorPreco > 0;
                            
                            return (
                              <TableCell key={fornecedor.id} className="text-right">
                                {preco ? (
                                  <div className="space-y-2">
                                    <div className={`font-semibold ${isMinPrice ? 'text-green-600' : ''}`}>
                                      R$ {preco.toFixed(2)}
                                      {isMinPrice && <span className="text-xs ml-1">🏆</span>}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Select
                                        value={produto.unidades[fornecedor.nome] || 'Kg'}
                                        onValueChange={(unidade) => {
                                          setProdutosCotacao(prev => prev.map(p => 
                                            p.id === produto.id 
                                              ? { ...p, unidades: { ...p.unidades, [fornecedor.nome]: unidade } }
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
                                        value={produto.quantidades[fornecedor.nome] || ''}
                                        onChange={(e) => {
                                          const quantidade = parseFloat(e.target.value) || 0;
                                          setProdutosCotacao(prev => prev.map(p => 
                                            p.id === produto.id 
                                              ? { ...p, quantidades: { ...p.quantidades, [fornecedor.nome]: quantidade } }
                                              : p
                                          ));
                                        }}
                                        className="w-20 h-8 text-right"
                                        placeholder="0"
                                      />
                                    </div>
                                    {produto.quantidades[fornecedor.nome] > 0 && (
                                      <div className="text-xs text-gray-600">
                                        Subtotal: R$ {(preco * produto.quantidades[fornecedor.nome]).toFixed(2)}
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

        {produtosCotacao.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma cotação iniciada
            </h3>
            <p className="text-gray-500">
              Cole uma mensagem de fornecedor acima para começar a comparar preços.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cotacao;
