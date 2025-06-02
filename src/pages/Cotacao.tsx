
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, Plus, Trash2, ArrowLeft, Calculator } from 'lucide-react';
import { toast } from 'sonner';

const Cotacao = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dicionário estruturado hierarquicamente
  const dicionarioProdutos = {
    'abacaxi': {
      'havaí': ['havaí', 'havai', 'hawai'],
      'pérola': ['pérola', 'perola']
    },
    'abacate': {
      'breda': ['breda'],
      'bola': ['bola']
    },
    'abóbora': {
      'cabotiá': ['cabotiá', 'cabotia', 'cabotia graúdo'],
      'seca': ['seca', 'abóbora seca'],
      'pescoço': ['pescoço', 'abóbora pescoço'],
      'moranga': ['moranga', 'abóbora moranga'],
      'menina': ['menina', 'abóbora menina']
    },
    'abobrinha': {
      'padrão': ['abobrinha', 'abobrinha padrão'],
      'verde': ['abobrinha verde'],
      'lv': ['abobrinha lv'],
      'klaina': ['abobrinha klaina'],
      'colombense': ['abobrinha colombense']
    },
    'acelga': {
      'padrão': ['acelga', 'acelga padrão']
    },
    'agrião': {
      'padrão': ['agrião']
    },
    'alho-poró': {
      'padrão': ['alho poró']
    },
    'alho': {
      'descascado': ['alho descascado']
    },
    'alface': {
      'crespa': ['alface crespa'],
      'crespa kael': ['alface crespa kael'],
      'americana': ['alface americana'],
      'americana kael': ['alface americana kael']
    },
    'banana': {
      'plástica': ['banana plástica'],
      'katurra': ['banana katurra'],
      'maçã': ['banana maçã'],
      'ouro': ['banana ouro'],
      'terra': ['banana terra'],
      'prata': ['banana prata']
    },
    'batata': {
      'asterix': ['batata asterix'],
      'doce': ['batata doce'],
      'doce roxa': ['batata doce roxa'],
      'doce top graúda': ['batata doce top graúda'],
      'doce miúda': ['batata doce miúda'],
      'doce branca': ['batata doce branca'],
      'inhame': ['batata inhame'],
      'yame': ['batata yame'],
      'salsa bandeja': ['batata salsa', 'salsa bandeja'],
      'salsa kg': ['batata salsa kg', 'salsa kg'],
      'salsa baroa': ['batata salsa baroa', 'batata baroa', 'mandioquinha']
    },
    'tomate': {
      'longa vida': ['tomate longa vida'],
      'longa vida graúdo': ['tomate longa vida graúdo'],
      'saladete': ['tomate saladete'],
      'saladete graúdo': ['tomate saladete graúdo'],
      'cereja bdj': ['tomate cereja bandeja'],
      'cereja cx': ['tomate cereja caixa'],
      'cereja klaina': ['tomate cereja klaina']
    }
  };

  const [mensagens, setMensagens] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [produtosExtraidos, setProdutosExtraidos] = useState([]);
  const [tabelaComparativa, setTabelaComparativa] = useState([]);

  // Função para extrair produtos de uma mensagem usando o dicionário hierárquico
  const extrairProdutos = (mensagem, nomeFornecedor) => {
    const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
    const produtos = [];

    linhas.forEach(linha => {
      const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
      const precos = linha.match(regexPreco);

      if (precos && precos.length > 0) {
        const preco = precos[precos.length - 1].replace(',', '.');
        const linhaNormalizada = linha.toLowerCase();
        let melhorMatch = { length: 0, produto: null, tipo: null, alias: '' };

        for (const [nomeProduto, tipos] of Object.entries(dicionarioProdutos)) {
          for (const [nomeTipo, aliases] of Object.entries(tipos)) {
            for (const alias of aliases) {
              if (linhaNormalizada.includes(alias.toLowerCase())) {
                if (alias.length > melhorMatch.length) {
                  melhorMatch = {
                    length: alias.length,
                    produto: nomeProduto,
                    tipo: nomeTipo,
                    alias: alias
                  };
                }
              }
            }
          }
        }

        if (melhorMatch.produto) {
          let infoAdicional = linha;
          precos.forEach(p => {
            infoAdicional = infoAdicional.replace(p, '');
          });

          const indexAlias = infoAdicional.toLowerCase().indexOf(melhorMatch.alias.toLowerCase());
          if (indexAlias !== -1) {
            const antesAlias = infoAdicional.substring(0, indexAlias).trim();
            const depoisAlias = infoAdicional.substring(indexAlias + melhorMatch.alias.length).trim();
            infoAdicional = (antesAlias + ' ' + depoisAlias).trim();
          }

          infoAdicional = infoAdicional.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();

          let tipoFinal = melhorMatch.tipo;
          if (infoAdicional && infoAdicional.length > 1) {
            tipoFinal += (melhorMatch.tipo === 'padrão' ? '' : ' ') + infoAdicional;
          }

          const nomeProdutoLowerCase = melhorMatch.produto.toLowerCase();
          const tipoFinalLowerCase = tipoFinal.toLowerCase();
          if (tipoFinalLowerCase.includes(nomeProdutoLowerCase)) {
            tipoFinal = tipoFinal.replace(new RegExp(melhorMatch.produto, 'gi'), '').trim();
            tipoFinal = tipoFinal.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
            if (!tipoFinal || tipoFinal.length === 0) {
              tipoFinal = 'padrão';
            }
          }

          produtos.push({
            produto: melhorMatch.produto.charAt(0).toUpperCase() + melhorMatch.produto.slice(1),
            tipo: tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
            preco: parseFloat(preco),
            fornecedor: nomeFornecedor,
            linhaOriginal: linha,
            aliasUsado: melhorMatch.alias
          });
        }
      }
    });

    return produtos;
  };

  const adicionarMensagem = () => {
    setMensagens([...mensagens, { fornecedor: '', mensagem: '' }]);
  };

  const atualizarMensagem = (index, campo, valor) => {
    const novasMensagens = [...mensagens];
    novasMensagens[index][campo] = valor;
    setMensagens(novasMensagens);
  };

  const removerMensagem = (index) => {
    const novasMensagens = mensagens.filter((_, i) => i !== index);
    setMensagens(novasMensagens);
  };

  const processarMensagens = () => {
    let todosProdutos = [];
    let nomesFornecedores = [];

    mensagens.forEach(({ fornecedor, mensagem }) => {
      if (fornecedor && mensagem) {
        const produtos = extrairProdutos(mensagem, fornecedor);
        todosProdutos = [...todosProdutos, ...produtos];
        if (!nomesFornecedores.includes(fornecedor)) {
          nomesFornecedores.push(fornecedor);
        }
      }
    });

    setProdutosExtraidos(todosProdutos);
    setFornecedores(nomesFornecedores);
    criarTabelaComparativa(todosProdutos, nomesFornecedores);
    
    if (todosProdutos.length > 0) {
      toast.success(`${todosProdutos.length} produtos extraídos com sucesso!`);
    } else {
      toast.error('Nenhum produto foi encontrado nas mensagens');
    }
  };

  const criarTabelaComparativa = (produtos, fornecedores) => {
    const produtosAgrupados = {};

    produtos.forEach(produto => {
      const chave = `${produto.produto}_${produto.tipo}`;
      if (!produtosAgrupados[chave]) {
        produtosAgrupados[chave] = {
          produto: produto.produto,
          tipo: produto.tipo,
          fornecedores: {},
          quantidades: {}
        };
        fornecedores.forEach(f => {
          produtosAgrupados[chave].fornecedores[f] = null;
          produtosAgrupados[chave].quantidades[f] = 0;
        });
      }
      produtosAgrupados[chave].fornecedores[produto.fornecedor] = produto.preco;
    });

    const tabela = Object.values(produtosAgrupados).sort((a, b) => {
      if (a.produto === b.produto) {
        return a.tipo.localeCompare(b.tipo);
      }
      return a.produto.localeCompare(b.produto);
    });

    setTabelaComparativa(tabela);
  };

  const atualizarQuantidade = (produtoIndex, fornecedor, quantidade) => {
    const novaTabela = [...tabelaComparativa];
    novaTabela[produtoIndex].quantidades[fornecedor] = parseInt(quantidade) || 0;
    setTabelaComparativa(novaTabela);
  };

  const calcularTotalFornecedor = (fornecedor) => {
    return tabelaComparativa.reduce((total, item) => {
      const preco = item.fornecedores[fornecedor];
      const quantidade = item.quantidades[fornecedor] || 0;
      return total + ((preco !== null ? preco : 0) * quantidade);
    }, 0);
  };

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
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Nova Cotação</h1>
                <p className="text-sm text-gray-500">Sistema FLV</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.nome}</p>
                <p className="text-xs text-gray-500">Comprador</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
            {/* Seção de Mensagens */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Mensagens dos Fornecedores</h2>
                <Button onClick={adicionarMensagem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Fornecedor
                </Button>
              </div>

              {mensagens.map((item, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex gap-4 mb-3">
                      <Input
                        placeholder="Nome do Fornecedor"
                        value={item.fornecedor}
                        onChange={(e) => atualizarMensagem(index, 'fornecedor', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removerMensagem(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <textarea
                      placeholder="Cole aqui a mensagem do WhatsApp com os produtos..."
                      value={item.mensagem}
                      onChange={(e) => atualizarMensagem(index, 'mensagem', e.target.value)}
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                  </CardContent>
                </Card>
              ))}

              {mensagens.length > 0 && (
                <Button onClick={processarMensagens} className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Processar Mensagens
                </Button>
              )}
            </div>

            {/* Tabela Comparativa */}
            {tabelaComparativa.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Comparação de Preços</h2>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Tipo</TableHead>
                        {fornecedores.map(fornecedor => (
                          <TableHead key={fornecedor} className="text-center min-w-[150px]">
                            {fornecedor}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabelaComparativa.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.produto}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.tipo}</Badge>
                          </TableCell>
                          {fornecedores.map(fornecedor => (
                            <TableCell key={fornecedor} className="text-center">
                              {item.fornecedores[fornecedor] !== null ? (
                                <div className="space-y-2">
                                  <div className="font-semibold text-green-600">
                                    R$ {item.fornecedores[fornecedor].toFixed(2)}
                                  </div>
                                  <Input
                                    type="number"
                                    placeholder="Qtd"
                                    min="0"
                                    value={item.quantidades[fornecedor] || ''}
                                    onChange={(e) => atualizarQuantidade(index, fornecedor, e.target.value)}
                                    className="w-16 text-center"
                                  />
                                </div>
                              ) : (
                                <div className="text-gray-400">-</div>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                      {/* Linha de Totais */}
                      <TableRow className="border-t-2 bg-gray-50 font-semibold">
                        <TableCell colSpan={2}>TOTAL GERAL</TableCell>
                        {fornecedores.map(fornecedor => (
                          <TableCell key={fornecedor} className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              R$ {calcularTotalFornecedor(fornecedor).toFixed(2)}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Produtos Extraídos (Debug) */}
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

            {/* Instruções */}
            <Card className="bg-blue-50 border-l-4 border-blue-500">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
                <ol className="text-blue-700 text-sm space-y-1">
                  <li>1. Clique em "Adicionar Fornecedor" para cada fornecedor</li>
                  <li>2. Digite o nome do fornecedor e cole a mensagem do WhatsApp</li>
                  <li>3. Clique em "Processar Mensagens" para extrair os produtos</li>
                  <li>4. Na tabela, insira as quantidades desejadas para cada produto</li>
                  <li>5. Compare os totais por fornecedor na última linha</li>
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
