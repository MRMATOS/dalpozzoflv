
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, ArrowLeft, Calculator, Search, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useRequisicoes } from '@/hooks/useRequisicoes';

// Interfaces para tipagem
interface ProdutoExtraido {
  produto: string;
  tipo: string;
  preco: number;
  fornecedor: string;
  linhaOriginal: string;
  aliasUsado: string;
}

interface ItemTabelaComparativa {
  produto: string;
  tipo: string;
  fornecedores: { [fornecedor: string]: number | null };
  quantidades: { [fornecedor: string]: number };
}

interface MensagemFornecedor {
  fornecedor: string;
  mensagem: string;
}

const Cotacao = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { fornecedores } = useFornecedores();
  const { requisicoes, lojasComRequisicoes } = useRequisicoes();

  // Dicionário estruturado hierarquicamente (mantendo exato como o original)
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

    'ameixa': {
      'nacional': ['ameixa nacional'],
      'importada calibre 60': ['ameixa importada calibre 60'],
      'importada calibre 65': ['ameixa importada calibre 65']
    },

    'atemoia': {
      'padrão': ['atemoia']
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

    'berinjela': {
      'padrão': ['berinjela', 'beringela'],
      '10kg': ['berinjela 10']
    },

    'beterraba': {
      'padrão': ['beterraba'],
      'selecionada': ['beterraba selecionada'],
      'm': ['beterraba m'],
      'produtor': ['beterraba produtor'],
      'box': ['beterraba box']
    },

    'brócolis': {
      'padrão': ['brócolis', 'brocolis']
    },

    'caqui': {
      'fuiu': ['caqui fuiu'],
      'chocolate': ['caqui chocolate']
    },

    'coco': {
      'seco': ['coco seco'],
      'verde': ['coco verde']
    },

    'couve': {
      'maço': ['couve maço']
    },

    'couve-flor': {
      'média': ['couve-flor média'],
      'graúda': ['couve-flor graúda']
    },

    'escarola': {
      'padrão': ['escarola']
    },

    'espinafre': {
      'padrão': ['espinafre']
    },

    'gengibre': {
      'padrão': ['gengibre'],
      'novo': ['gengibre novo']
    },

    'giló': {
      'padrão': ['giló', 'gilo']
    },

    'goiaba': {
      'graúda': ['goiaba graúda'],
      'padrão': ['goiaba']
    },

    'hortelã': {
      'padrão': ['hortelã']
    },

    'kiwi': {
      'nacional': ['kiwi nacional'],
      'importado 9kg': ['kiwi importado 9'],
      'importado calibre 20/25': ['kiwi importado calibre 20/25'],
      'bandeja': ['kiwi bandeja']
    },

    'laranja': {
      'fabi': ['laranja fabi'],
      'pera rio': ['laranja pera rio'],
      'pera roça': ['laranja pera roça'],
      'lima': ['laranja lima'],
      'bahia nacional': ['laranja bahia nacional'],
      'bahia importada 72': ['laranja bahia importada 72'],
      'bahia importada': ['laranja bahia importada'],
      'valência importada': ['laranja valência importada'],
      'comum': ['laranja']
    },

    'limão': {
      'graúdo': ['limão graúdo'],
      'siciliano': ['limão siciliano']
    },

    'mamão': {
      'formosa': ['mamão formosa'],
      'papaya t20': ['mamão papaya 20'],
      'papaya t24': ['mamão papaya 24'],
      'papaya top': ['mamão papaya top'],
      'roça': ['mamão roça']
    },

    'manga': {
      'espada': ['manga espada'],
      'tomy': ['manga tomy'],
      'tomy rio sul': ['manga tomy rio sul'],
      'tomy vale bonito': ['manga tomy vale bonito'],
      'palmer': ['manga palmer'],
      'palmer baía': ['manga palmer baía']
    },

    'maracujá': {
      'padrão': ['maracujá'],
      'graúdo': ['maracujá graúdo'],
      'papelão': ['maracujá papelão'],
      'plástica top': ['maracujá plástica top']
    },

    'maçã': {
      'importada vermelha': ['maçã importada vermelha'],
      'pinki': ['maçã pinki'],
      'fuji cat3 embalada': ['maçã fuji cat3 embalada'],
      'fuji cat1 importada': ['maçã fuji importada cat1'],
      'gala': ['maçã gala'],
      'monica': ['maçã monica'],
      'red elegido cat2': ['maçã red elegido cat2'],
      'red elegido 36/40': ['maçã red elegido 36/40'],
      'verde cat1': ['maçã verde cat1']
    },

    'melancia': {
      'baby': ['melancia baby']
    },

    'melão': {
      'amarelo': ['melão amarelo'],
      'amarelo graúdo': ['melão amarelo graúdo'],
      'melícia': ['melão melícia'],
      'cepi': ['melão cepi'],
      'rei': ['melão rei'],
      'gaia': ['melão gaia'],
      'sapo': ['melão sapo'],
      'solto': ['melão solto']
    },

    'milho verde': {
      'padrão': ['milho verde'],
      'bandeja': ['milho verde bandeja'],
      'c4': ['milho verde c4'],
      'klaina': ['milho verde klaina'],
      'klaina 4 espigas': ['klaina 4 espigas']
    },

    'mirtilo': {
      'padrão': ['mirtilo']
    },

    'nectarina': {
      'importada': ['nectarina importada']
    },

    'pepino': {
      'salada': ['pepino salada'],
      'salada top': ['pepino salada top'],
      'japonês': ['pepino japonês'],
      'japonês klaina': ['pepino japonês klaina'],
      'conserva': ['pepino conserva']
    },

    'pera': {
      'nacional': ['pera nacional'],
      'importada': ['pera importada'],
      'willian': ['pera willian 80/90/100']
    },

    'pêssego': {
      'importado': ['pêssego importado'],
      'nacional': ['pêssego nacional']
    },

    'physalis': {
      'padrão': ['physalis']
    },

    'pimenta': {
      'dedo-de-moça': ['pimenta dedo-de-moça'],
      'cambuci': ['pimenta cambuci', 'cambuci'],
      'vermelha': ['pimenta vermelha']
    },

    'pimentão': {
      'verde': ['pimentão verde'],
      'verde klaina': ['pimentão verde klaina'],
      'verde região': ['pimentão verde região'],
      'verde graúdo': ['pimentão verde graúdo', 'pimentão verde médio'],
      'vermelho': ['pimentão vermelho'],
      'vermelho graúdo': ['pimentão vermelho graúdo'],
      'amarelo': ['pimentão amarelo'],
      'amarelo graúdo': ['pimentão amarelo graúdo', 'pimentão amarelo médio']
    },

    'pitaya': {
      'padrão': ['pitaya']
    },

    'ponkan': {
      'cerro': ['ponkan cerro'],
      'fabi': ['ponkan fabi'],
      'padrão': ['ponkan']
    },

    'quiabo': {
      'padrão': ['quiabo']
    },

    'rabanete': {
      'padrão': ['rabanete'],
      'maço': ['rabanete maço']
    },

    'repolho': {
      'verde': ['repolho verde'],
      'roxo': ['repolho roxo']
    },

    'tâmara': {
      'padrão': ['tâmara']
    },

    'tangerina': {
      'olé': ['tangerina olé', 'olé'],
      'murcote': ['murcote', 'morgote', 'murgote'],
      'ponkan': ['ponkan'],
      'mixixrica': ['mixixrica']
    },

    'tomate': {
      'longa vida': ['tomate longa vida'],
      'longa vida graúdo': ['tomate longa vida graúdo'],
      'saladete': ['tomate saladete'],
      'saladete graúdo': ['tomate saladete graúdo'],
      'cereja bdj': ['tomate cereja bandeja'],
      'cereja cx': ['tomate cereja caixa'],
      'cereja klaina': ['tomate cereja klaina']
    },

    'uva': {
      'rosa': ['uva rosa'],
      'rubi': ['uva rubi'],
      'brasil': ['uva brasil'],
      'itália': ['uva itália', 'uva italia'],
      'thompson vale': ['uva thompson vale'],
      'thompson campo': ['uva thompson campo'],
      'thompson verde': ['uva thompson verde'],
      'vitória campo': ['uva vitória campo'],
      'vitória rei': ['uva vitória rei'],
      'vitória': ['uva vitória']
    },

    'vagem': {
      'branca': ['vagem branca', 'vagem']
    },

    'verona': {
      'top': ['verona top']
    }
  };

  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string | null>(null);
  const [fornecedoresProcessados, setFornecedoresProcessados] = useState<Set<string>>(new Set());
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [produtosExtraidos, setProdutosExtraidos] = useState<ProdutoExtraido[]>([]);
  const [tabelaComparativa, setTabelaComparativa] = useState<ItemTabelaComparativa[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');

  // Filtrar produtos baseado na busca
  const produtosFiltrados = tabelaComparativa.filter(item => 
    item.produto.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    item.tipo.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  // Lista de fornecedores únicos dos produtos extraídos
  const fornecedoresComProdutos = [...new Set(produtosExtraidos.map(p => p.fornecedor))];

  // Função para calcular percentual de suprimento por loja
  const calcularPercentualSuprimento = (loja: string) => {
    const requisicoesDaLoja = requisicoes.filter(req => req.loja === loja);
    
    if (requisicoesDaLoja.length === 0) return 0;

    let totalRequisitado = 0;
    let totalSuprido = 0;

    requisicoesDaLoja.forEach(requisicao => {
      totalRequisitado += requisicao.quantidade_calculada;

      // Encontrar o produto na tabela comparativa
      const produtoTabela = tabelaComparativa.find(item => {
        // Comparar usando nome do produto diretamente
        const produtoRequisitado = requisicao.produto_nome.toLowerCase().trim();
        const produtoTabela = item.produto.toLowerCase().trim();
        const tipoTabela = item.tipo.toLowerCase().trim();
        
        return produtoRequisitado.includes(produtoTabela) || 
               produtoTabela.includes(produtoRequisitado) ||
               produtoRequisitado.includes(tipoTabela) ||
               tipoTabela.includes(produtoRequisitado);
      });

      if (produtoTabela) {
        // Somar todas as quantidades definidas para este produto
        const quantidadesTotais = Object.values(produtoTabela.quantidades).reduce((sum, qtd) => sum + qtd, 0);
        totalSuprido += Math.min(quantidadesTotais, requisicao.quantidade_calculada);
      }
    });

    return totalRequisitado > 0 ? Math.round((totalSuprido / totalRequisitado) * 100) : 0;
  };

  // Função para obter quantidade requisitada para um produto - CORRIGIDA
  const obterQuantidadeRequisitada = (produto: string, tipo: string) => {
    console.log('Buscando requisição para:', produto, tipo);
    console.log('Requisições disponíveis:', requisicoes);
    
    // Normalizar strings para comparação
    const produtoNorm = produto.toLowerCase().trim();
    const tipoNorm = tipo.toLowerCase().trim();
    
    let totalQuantidade = 0;
    let unidadeEncontrada = '';
    
    // Buscar por correspondências diretas no nome do produto
    const requisicoesCorrespondentes = requisicoes.filter(req => {
      const produtoReqNorm = req.produto_nome.toLowerCase().trim();
      
      // Verificar correspondência direta
      if (produtoReqNorm.includes(produtoNorm) || produtoNorm.includes(produtoReqNorm)) {
        return true;
      }
      
      // Verificar se o tipo corresponde ao produto requisitado
      if (produtoReqNorm.includes(tipoNorm) || tipoNorm.includes(produtoReqNorm)) {
        return true;
      }
      
      // Buscar usando o dicionário de produtos para correspondências mais complexas
      for (const [nomeProdutoDict, tipos] of Object.entries(dicionarioProdutos)) {
        if (produtoNorm.includes(nomeProdutoDict) || nomeProdutoDict.includes(produtoNorm)) {
          for (const [nomeTipo, aliases] of Object.entries(tipos)) {
            if (aliases.some(alias => 
              produtoReqNorm.includes(alias.toLowerCase()) || 
              alias.toLowerCase().includes(produtoReqNorm)
            )) {
              return true;
            }
          }
        }
      }
      
      return false;
    });

    // Somar as quantidades encontradas
    requisicoesCorrespondentes.forEach(req => {
      totalQuantidade += req.quantidade_calculada;
      if (!unidadeEncontrada) {
        unidadeEncontrada = req.unidade;
      }
    });

    console.log('Quantidade encontrada:', totalQuantidade, unidadeEncontrada);

    if (totalQuantidade > 0) {
      return `${totalQuantidade} ${unidadeEncontrada}`;
    }

    return '-';
  };

  // Função para extrair produtos de uma mensagem usando o dicionário hierárquico - MANTENDO LÓGICA ORIGINAL
  const extrairProdutos = (mensagem: string, nomeFornecedor: string): ProdutoExtraido[] => {
    const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
    const produtos: ProdutoExtraido[] = [];

    linhas.forEach(linha => {
      // Regex para encontrar preços nos formatos: xx.xx, x.xx, xx,xx, x,xx, x,x, x.x
      const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
      const precos = linha.match(regexPreco);

      if (precos && precos.length > 0) {
        const preco = precos[precos.length - 1].replace(',', '.'); // Último preço encontrado

        // Encontrar o produto base e tipo correspondente usando o dicionário hierárquico
        const linhaNormalizada = linha.toLowerCase();
        let melhorMatch = { length: 0, produto: null as string | null, tipo: null as string | null, alias: '' };

        // Procurar em todos os produtos do dicionário
        for (const [nomeProduto, tipos] of Object.entries(dicionarioProdutos)) {
          for (const [nomeTipo, aliases] of Object.entries(tipos)) {
            for (const alias of aliases) {
              if (linhaNormalizada.includes(alias.toLowerCase())) {
                // Prioriza matches mais longos (mais específicos)
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

        if (melhorMatch.produto && melhorMatch.tipo) {
          // Extrair informações adicionais da linha (peso, qualidade, etc.)
          let infoAdicional = linha;

          // Remove o preço da linha
          precos.forEach(p => {
            infoAdicional = infoAdicional.replace(p, '');
          });

          // Remove o alias encontrado
          const indexAlias = infoAdicional.toLowerCase().indexOf(melhorMatch.alias.toLowerCase());
          if (indexAlias !== -1) {
            const antesAlias = infoAdicional.substring(0, indexAlias).trim();
            const depoisAlias = infoAdicional.substring(indexAlias + melhorMatch.alias.length).trim();
            infoAdicional = (antesAlias + ' ' + depoisAlias).trim();
          }

          // Remove caracteres extras
          infoAdicional = infoAdicional.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();

          // Monta o tipo final
          let tipoFinal = melhorMatch.tipo;
          if (infoAdicional && infoAdicional.length > 1) {
            tipoFinal += (melhorMatch.tipo === 'padrão' ? '' : ' ') + infoAdicional;
          }

          // Remove o nome do produto do tipo se estiver presente
          const nomeProdutoLowerCase = melhorMatch.produto.toLowerCase();
          const tipoFinalLowerCase = tipoFinal.toLowerCase();
          if (tipoFinalLowerCase.includes(nomeProdutoLowerCase)) {
            tipoFinal = tipoFinal.replace(new RegExp(melhorMatch.produto, 'gi'), '').trim();
            // Remove espaços duplos e limpa o início/fim
            tipoFinal = tipoFinal.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
            // Se ficou vazio, volta para 'padrão'
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

  const selecionarFornecedor = (fornecedorId: string) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    if (!fornecedor) return;

    // Se o fornecedor já foi processado, pergunta se deseja apagar
    if (fornecedoresProcessados.has(fornecedor.nome)) {
      if (window.confirm(`Deseja apagar os produtos do ${fornecedor.nome}?`)) {
        removerProdutosFornecedor(fornecedor.nome);
      }
      return;
    }

    // Seleciona o fornecedor
    setFornecedorSelecionado(fornecedorId);
    setMensagemAtual('');
  };

  const processarMensagem = () => {
    if (!fornecedorSelecionado || !mensagemAtual.trim()) {
      toast.error('Selecione um fornecedor e cole a mensagem');
      return;
    }

    const fornecedor = fornecedores.find(f => f.id === fornecedorSelecionado);
    if (!fornecedor) return;

    const produtos = extrairProdutos(mensagemAtual, fornecedor.nome);
    
    if (produtos.length > 0) {
      // Adiciona produtos do fornecedor
      const novosExtraidos = [...produtosExtraidos.filter(p => p.fornecedor !== fornecedor.nome), ...produtos];
      setProdutosExtraidos(novosExtraidos);
      
      // Marca fornecedor como processado
      setFornecedoresProcessados(prev => new Set(prev).add(fornecedor.nome));
      
      // Atualiza tabela comparativa
      criarTabelaComparativa(novosExtraidos, [...fornecedoresComProdutos.filter(f => f !== fornecedor.nome), fornecedor.nome]);
      
      // Limpa seleção
      setFornecedorSelecionado(null);
      setMensagemAtual('');
      
      toast.success(`${produtos.length} produtos extraídos de ${fornecedor.nome}!`);
    } else {
      toast.error('Nenhum produto foi encontrado na mensagem');
    }
  };

  const removerProdutosFornecedor = (nomeFornecedor: string) => {
    // Remove produtos do fornecedor
    const novosExtraidos = produtosExtraidos.filter(p => p.fornecedor !== nomeFornecedor);
    setProdutosExtraidos(novosExtraidos);
    
    // Remove da lista de processados
    const novosProcessados = new Set(fornecedoresProcessados);
    novosProcessados.delete(nomeFornecedor);
    setFornecedoresProcessados(novosProcessados);
    
    // Atualiza tabela
    const novosFornecedores = [...new Set(novosExtraidos.map(p => p.fornecedor))];
    criarTabelaComparativa(novosExtraidos, novosFornecedores);
    
    toast.success(`Produtos de ${nomeFornecedor} removidos`);
  };

  const criarTabelaComparativa = (produtos: ProdutoExtraido[], fornecedoresList: string[]) => {
    const produtosAgrupados: { [chave: string]: ItemTabelaComparativa } = {};

    produtos.forEach(produto => {
      const chave = `${produto.produto}_${produto.tipo}`;
      if (!produtosAgrupados[chave]) {
        produtosAgrupados[chave] = {
          produto: produto.produto,
          tipo: produto.tipo,
          fornecedores: {},
          quantidades: {}
        };
        // Inicializar todos os fornecedores com valores vazios
        fornecedoresList.forEach(f => {
          produtosAgrupados[chave].fornecedores[f] = null;
          produtosAgrupados[chave].quantidades[f] = 0;
        });
      }
      produtosAgrupados[chave].fornecedores[produto.fornecedor] = produto.preco;
    });

    // Converter para array e ordenar alfabeticamente por produto
    const tabela = Object.values(produtosAgrupados).sort((a, b) => {
      if (a.produto === b.produto) {
        return a.tipo.localeCompare(b.tipo);
      }
      return a.produto.localeCompare(b.produto);
    });

    setTabelaComparativa(tabela);
  };

  const atualizarQuantidade = (produtoIndex: number, fornecedor: string, quantidade: string) => {
    const novaTabela = [...tabelaComparativa];
    novaTabela[produtoIndex].quantidades[fornecedor] = parseInt(quantidade) || 0;
    setTabelaComparativa(novaTabela);
  };

  const calcularTotalFornecedor = (fornecedor: string) => {
    return tabelaComparativa.reduce((total, item) => {
      const preco = item.fornecedores[fornecedor];
      const quantidade = item.quantidades[fornecedor] || 0;
      return total + ((preco !== null ? preco : 0) * quantidade);
    }, 0);
  };

  const irParaResumo = () => {
    // Verificar se há produtos com quantidades definidas
    const temProdutosComQuantidade = tabelaComparativa.some(item => 
      Object.values(item.quantidades).some(quantidade => quantidade > 0)
    );

    if (!temProdutosComQuantidade) {
      toast.error('Defina as quantidades dos produtos antes de gerar o resumo');
      return;
    }

    navigate('/resumo-pedido', { 
      state: { 
        tabelaComparativa 
      } 
    });
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
                <p className="text-sm font-medium text-gray-900">{profile?.nome}</p>
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
            {/* Seção de Fornecedores */}
            <div className="mb-8">
              {/* Botões dos Fornecedores */}
              <div className="flex flex-wrap gap-3 mb-4">
                {fornecedores.map((fornecedor) => {
                  const isProcessado = fornecedoresProcessados.has(fornecedor.nome);
                  const isSelecionado = fornecedorSelecionado === fornecedor.id;
                  
                  return (
                    <Button
                      key={fornecedor.id}
                      onClick={() => selecionarFornecedor(fornecedor.id)}
                      variant={isProcessado ? "default" : isSelecionado ? "default" : "outline"}
                      className={`${
                        isProcessado 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : isSelecionado 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : ''
                      }`}
                    >
                      {fornecedor.nome}
                      {isProcessado && <Trash2 className="w-4 h-4 ml-2" />}
                    </Button>
                  );
                })}
              </div>

              {/* Área de Mensagem */}
              {fornecedorSelecionado && (
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <textarea
                      placeholder="Cole aqui a mensagem do WhatsApp com os produtos..."
                      value={mensagemAtual}
                      onChange={(e) => setMensagemAtual(e.target.value)}
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    />
                    <div className="mt-3">
                      <Button onClick={processarMensagem} className="bg-blue-600 hover:bg-blue-700">
                        <Upload className="w-4 h-4 mr-2" />
                        Processar Mensagem
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Tabela Comparativa */}
            {tabelaComparativa.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Comparação de Preços</h2>
                
                {/* Área fixa com busca, cards de loja e botão resumo */}
                <div className="sticky top-0 bg-white z-30 pb-4 border-b mb-4">
                  <div className="flex justify-between items-center gap-4 mb-4">
                    {/* Input de busca - tamanho reduzido */}
                    <div className="relative flex-1 max-w-xs">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar produto..."
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Cards das lojas */}
                    <div className="flex gap-3">
                      {lojasComRequisicoes.map((loja) => {
                        const percentual = calcularPercentualSuprimento(loja);
                        const corFundo = percentual >= 80 ? 'bg-green-100' : percentual >= 50 ? 'bg-yellow-100' : 'bg-red-100';
                        const corTexto = percentual >= 80 ? 'text-green-800' : percentual >= 50 ? 'text-yellow-800' : 'text-red-800';
                        
                        return (
                          <div key={loja} className={`px-4 py-2 rounded-lg border ${corFundo} ${corTexto} min-w-[100px]`}>
                            <div className="flex justify-between items-center text-sm font-medium">
                              <span>{loja}</span>
                              <span>{percentual}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  percentual >= 80 ? 'bg-green-500' : percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${percentual}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Botão Ver Resumo - azul com texto branco */}
                    <Button 
                      onClick={irParaResumo}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Ver Resumo
                    </Button>
                  </div>
                </div>

                {/* Header fixo da tabela */}
                <div className="sticky top-[140px] bg-white z-20 border rounded-t-lg shadow-sm">
                  <div className="grid grid-cols-[200px_200px_150px_1fr] border-b bg-gray-50">
                    <div className="p-4 font-medium text-muted-foreground border-r">Produto</div>
                    <div className="p-4 font-medium text-muted-foreground border-r">Tipo</div>
                    <div className="p-4 font-medium text-muted-foreground border-r">Requisição</div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${fornecedoresComProdutos.length}, 1fr)` }}>
                      {fornecedoresComProdutos.map((fornecedor, index) => (
                        <div 
                          key={fornecedor} 
                          className={`p-4 font-medium text-muted-foreground text-center ${
                            index < fornecedoresComProdutos.length - 1 ? 'border-r' : ''
                          }`}
                        >
                          {fornecedor}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Conteúdo da tabela com scroll */}
                <div className="border-l border-r border-b rounded-b-lg max-h-[500px] overflow-y-auto">
                  {produtosFiltrados.map((item, index) => {
                    // Calcular menor preço para este produto
                    const precos = fornecedoresComProdutos
                      .map(f => item.fornecedores[f])
                      .filter(p => p !== null) as number[];
                    const menorPreco = precos.length > 0 ? Math.min(...precos) : null;

                    return (
                      <div key={index} className="grid grid-cols-[200px_200px_150px_1fr] border-b last:border-b-0 hover:bg-gray-50">
                        <div className="p-4 font-medium border-r flex items-center">{item.produto}</div>
                        <div className="p-4 border-r flex items-center">
                          <Badge variant="secondary">{item.tipo}</Badge>
                        </div>
                        <div className="p-4 border-r flex items-center text-sm text-gray-600">
                          {obterQuantidadeRequisitada(item.produto, item.tipo)}
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: `repeat(${fornecedoresComProdutos.length}, 1fr)` }}>
                          {fornecedoresComProdutos.map((fornecedor, fornIndex) => {
                            const preco = item.fornecedores[fornecedor];
                            const isMelhorPreco = preco === menorPreco && preco !== null;
                            
                            return (
                              <div 
                                key={fornecedor} 
                                className={`p-4 flex flex-col items-center space-y-2 ${
                                  fornIndex < fornecedoresComProdutos.length - 1 ? 'border-r' : ''
                                }`}
                              >
                                {preco !== null ? (
                                  <>
                                    <div className={`font-semibold text-center ${
                                      isMelhorPreco 
                                        ? 'text-green-600 bg-green-100 px-2 py-1 rounded' 
                                        : 'text-gray-700'
                                    }`}>
                                      R$ {preco.toFixed(2)}
                                      {isMelhorPreco && ' 🏆'}
                                    </div>
                                    <Input
                                      type="number"
                                      placeholder="Qtd"
                                      min="0"
                                      value={item.quantidades[fornecedor] || ''}
                                      onChange={(e) => atualizarQuantidade(index, fornecedor, e.target.value)}
                                      className="w-24 text-center"
                                    />
                                  </>
                                ) : (
                                  <div className="text-gray-400">-</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Linha de Totais fixa no bottom */}
                <div className="sticky bottom-0 bg-gray-50 border border-t-2 rounded-b-lg">
                  <div className="grid grid-cols-[200px_200px_150px_1fr] font-semibold">
                    <div className="p-4 bg-gray-50 border-r flex items-center">TOTAL GERAL</div>
                    <div className="p-4 bg-gray-50 border-r"></div>
                    <div className="p-4 bg-gray-50 border-r"></div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${fornecedoresComProdutos.length}, 1fr)` }}>
                      {(() => {
                        // Calcular totais e encontrar o menor
                        const totais = fornecedoresComProdutos
                          .map(f => calcularTotalFornecedor(f))
                          .filter(t => t > 0);
                        const menorTotal = totais.length > 0 ? Math.min(...totais) : 0;

                        return fornecedoresComProdutos.map((fornecedor, fornIndex) => {
                          const total = calcularTotalFornecedor(fornecedor);
                          const isMelhorTotal = total === menorTotal && total > 0;
                          
                          return (
                            <div 
                              key={fornecedor} 
                              className={`p-4 flex justify-center items-center bg-gray-50 ${
                                fornIndex < fornecedoresComProdutos.length - 1 ? 'border-r' : ''
                              }`}
                            >
                              <div className={`text-lg font-bold ${
                                isMelhorTotal 
                                  ? 'text-green-600 bg-green-100 px-2 py-1 rounded'
                                  : 'text-blue-600'
                              }`}>
                                R$ {total.toFixed(2)}
                                {isMelhorTotal && ' 🏆'}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
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
