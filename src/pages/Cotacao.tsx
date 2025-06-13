import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, ArrowLeft, Calculator, Search, FileText, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFornecedores } from '@/hooks/useFornecedores';
import { useRequisicoes } from '@/hooks/useRequisicoes';
import { useEstoque } from '@/hooks/useEstoque';
import { supabase } from '@/integrations/supabase/client';
import { useCotacaoTemporaria } from '@/hooks/useCotacaoTemporaria';
import FornecedorCell from '@/components/cotacao/FornecedorCell';
import CotacaoActionButtons from '@/components/cotacao/CotacaoActionButtons';
import CotacaoRestauradaMessage from '@/components/cotacao/CotacaoRestauradaMessage';

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
  unidadePedido: { [fornecedor: string]: string };
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
  const { estoqueProdutos, isLoading: isLoadingEstoque, obterEstoqueProduto } = useEstoque();
  
  // Hook para persistência
  const { 
    salvarCotacao, 
    restaurarUltimaCotacao, 
    novaCotacao, 
    marcarComoEnviada,
    cotacaoRestaurada,
    salvandoAutomaticamente,
    isLoadingCotacao,
    dadosCarregados,
    sincronizarComTabela,
    converterTabelaParaCotacao,
    obterItensSelecionados
  } = useCotacaoTemporaria();

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
  const [produtosDB, setProdutosDB] = useState<any[]>([]);
  const [dadosInicializados, setDadosInicializados] = useState(false);

  // Inicializar dados quando carregados do hook
  useEffect(() => {
    if (!isLoadingCotacao && dadosCarregados && !dadosInicializados) {
      console.log('=== INICIALIZANDO DADOS DA COTAÇÃO ===');
      console.log('Dados carregados:', dadosCarregados);
      
      setProdutosExtraidos(dadosCarregados.produtosExtraidos);
      setTabelaComparativa(dadosCarregados.tabelaComparativa);
      setFornecedoresProcessados(dadosCarregados.fornecedoresProcessados);
      setDadosInicializados(true);
      
      console.log('Dados inicializados com sucesso');
    }
  }, [isLoadingCotacao, dadosCarregados, dadosInicializados]);

  // Buscar produtos do banco de dados
  useEffect(() => {
    const buscarProdutos = async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('ativo', true);
        
        if (error) {
          console.error('Erro ao buscar produtos:', error);
          return;
        }
        
        setProdutosDB(data || []);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };

    buscarProdutos();
  }, []);

  // Auto-salvar quando dados mudarem e sincronizar
  useEffect(() => {
    if (dadosInicializados && tabelaComparativa.length > 0 && !isLoadingCotacao) {
      const timeoutId = setTimeout(() => {
        console.log('Auto-salvando cotação...');
        salvarCotacao({
          produtosExtraidos,
          tabelaComparativa,
          fornecedoresProcessados
        });
        
        // Sincronizar com hook
        sincronizarComTabela(tabelaComparativa);
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [produtosExtraidos, tabelaComparativa, salvarCotacao, fornecedoresProcessados, dadosInicializados, isLoadingCotacao, sincronizarComTabela]);

  // Filtrar produtos baseado na busca
  const produtosFiltrados = tabelaComparativa.filter(item => 
    item.produto.toLowerCase().includes(buscaProduto.toLowerCase()) ||
    item.tipo.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  // Lista de fornecedores únicos dos produtos extraídos
  const fornecedoresComProdutos = [...new Set(produtosExtraidos.map(p => p.fornecedor))];

  // Verificar se há dados na cotação
  const temDados = produtosExtraidos.length > 0 || tabelaComparativa.length > 0;

  // Handlers para os botões de ação
  const handleRestaurarCotacao = async () => {
    const dadosRestaurados = await restaurarUltimaCotacao();
    if (dadosRestaurados) {
      setProdutosExtraidos(dadosRestaurados.produtosExtraidos);
      setTabelaComparativa(dadosRestaurados.tabelaComparativa);
      setFornecedoresProcessados(new Set<string>());
    }
  };

  const handleNovaCotacao = () => {
    const dadosLimpos = novaCotacao();
    setProdutosExtraidos(dadosLimpos.produtosExtraidos);
    setTabelaComparativa(dadosLimpos.tabelaComparativa);
    setFornecedoresProcessados(new Set<string>());
  };

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

  // Função para obter unidade padrão do produto no banco
  const obterUnidadePadraoProduto = (produto: string, tipo: string): string => {
    // Primeiro, tenta encontrar correspondência exata pelo nome completo
    const nomeCompleto = `${produto} ${tipo}`.toLowerCase();
    const produtoExato = produtosDB.find(p => 
      p.produto?.toLowerCase().includes(produto.toLowerCase()) &&
      (p.nome_variacao?.toLowerCase() === tipo.toLowerCase() || 
       p.nome_base?.toLowerCase() === tipo.toLowerCase())
    );
    
    if (produtoExato && produtoExato.unidade) {
      return produtoExato.unidade;
    }

    // Se não encontrou, busca apenas pelo produto base
    const produtoBase = produtosDB.find(p => 
      p.produto?.toLowerCase().includes(produto.toLowerCase()) ||
      p.nome_base?.toLowerCase().includes(produto.toLowerCase())
    );
    
    if (produtoBase && produtoBase.unidade) {
      return produtoBase.unidade;
    }

    // Fallback para Caixa se não encontrar
    return 'Caixa';
  };

  // Lista de todas as unidades disponíveis (baseada na configuração dos produtos)
  const unidadesDisponiveis = ['Caixa', 'Kg', 'Maço', 'Bandeja', 'Unidade', 'Dúzia'];

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
        // Obter unidade padrão do produto do banco de dados
        const unidadePadrao = obterUnidadePadraoProduto(produto.produto, produto.tipo);
        
        produtosAgrupados[chave] = {
          produto: produto.produto,
          tipo: produto.tipo,
          fornecedores: {},
          quantidades: {},
          unidadePedido: {}
        };
        
        // Inicializar todos os fornecedores com valores vazios
        fornecedoresList.forEach(f => {
          produtosAgrupados[chave].fornecedores[f] = null;
          produtosAgrupados[chave].quantidades[f] = 0;
          produtosAgrupados[chave].unidadePedido[f] = unidadePadrao; // Usar unidade padrão do produto
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

  const atualizarUnidadePedido = (produtoIndex: number, fornecedor: string, unidade: string) => {
    const novaTabela = [...tabelaComparativa];
    novaTabela[produtoIndex].unidadePedido[fornecedor] = unidade;
    setTabelaComparativa(novaTabela);
  };

  // Função para obter estoque de um produto
  const obterEstoquesDisplay = (produto: string, tipo: string) => {
    const estoque = obterEstoqueProduto(produto, tipo);
    
    if (!estoque || Object.keys(estoque.estoques_por_loja).length === 0) {
      return <div className="text-gray-400 text-sm">Sem estoque informado</div>;
    }

    const lojas = Object.entries(estoque.estoques_por_loja);
    const unidadeEstoque = estoque.unidade;
    const isCaixa = unidadeEstoque.toLowerCase() === 'caixa';

    return (
      <div className="text-sm space-y-1">
        {lojas.map(([loja, quantidade]) => (
          <div key={loja} className="text-gray-600">
            {loja}: <span className="font-medium">{quantidade}</span> {unidadeEstoque.toLowerCase()}
          </div>
        ))}
        <div className="font-semibold text-gray-800 border-t pt-1">
          Total: {estoque.total_estoque} {unidadeEstoque.toLowerCase()}
          {isCaixa && estoque.total_kg > 0 && (
            <div className="text-green-600">({estoque.total_kg.toFixed(1)}kg)</div>
          )}
        </div>
      </div>
    );
  };

  // Função para obter opções de unidade para um produto
  const obterOpcoesUnidade = (produto: string, tipo: string) => {
    // Retorna todas as unidades disponíveis no sistema
    return unidadesDisponiveis;
  };

  // Função para calcular total de um fornecedor
  const calcularTotalFornecedor = (fornecedor: string) => {
    return tabelaComparativa.reduce((total, item) => {
      const preco = item.fornecedores[fornecedor];
      const quantidade = item.quantidades[fornecedor] || 0;
      return total + (preco !== null ? preco : 0) * quantidade;
    }, 0);
  };

  const irParaResumo = () => {
    console.log('irParaResumo chamado');
    console.log('tabelaComparativa:', tabelaComparativa);
    
    // Verificar se há produtos com quantidades definidas
    const temProdutosComQuantidade = tabelaComparativa.some(item => {
      const quantidades = Object.values(item.quantidades || {});
      console.log(`Produto ${item.produto} - quantidades:`, quantidades);
      return quantidades.some(quantidade => quantidade > 0);
    });

    console.log('temProdutosComQuantidade:', temProdutosComQuantidade);

    if (!temProdutosComQuantidade) {
      toast.error('Defina as quantidades dos produtos antes de gerar o resumo');
      return;
    }

    // Sincronizar dados antes de navegar
    console.log('Sincronizando tabela antes de navegar...');
    sincronizarComTabela(tabelaComparativa);

    // Verificar se há itens selecionados no hook
    const itensSelecionados = obterItensSelecionados();
    console.log('Itens selecionados no hook:', itensSelecionados);

    console.log('Navegando para resumo-pedido');
    navigate('/resumo-pedido');
  };

  // Mostrar loading enquanto carrega dados
  if (isLoadingCotacao) {
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
      {/* Header */}
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
                {fornecedores.map(fornecedor => {
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
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none relative z-10 bg-white"
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

            {/* Mensagem de cotação restaurada */}
            {cotacaoRestaurada && (
              <CotacaoRestauradaMessage dataRestauracao={cotacaoRestaurada} />
            )}

            {/* Tabela Comparativa */}
            {tabelaComparativa.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Comparação de Preços</h2>
                
                {/* Área fixa com busca, cards de loja e botões de ação */}
                <div className="sticky top-0 bg-white z-30 pb-4 border-b mb-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    {/* Input de busca */}
                    <div className="relative flex-1 max-w-xs w-full sm:w-auto">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Buscar produto..."
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    {/* Cards das lojas - responsivo */}
                    <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                      {lojasComRequisicoes.map(loja => {
                        const percentual = calcularPercentualSuprimento(loja);
                        const corFundo = percentual >= 80 ? 'bg-green-100' : percentual >= 50 ? 'bg-yellow-100' : 'bg-red-100';
                        const corTexto = percentual >= 80 ? 'text-green-800' : percentual >= 50 ? 'text-yellow-800' : 'text-red-800';
                        
                        return (
                          <div key={loja} className={`px-3 py-2 rounded-lg border ${corFundo} ${corTexto} flex-1 min-w-[80px] sm:min-w-[100px]`}>
                            <div className="flex justify-between items-center text-xs sm:text-sm font-medium">
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
                    
                    {/* Botões de Ação */}
                    <CotacaoActionButtons
                      onRestaurarCotacao={handleRestaurarCotacao}
                      onNovaCotacao={handleNovaCotacao}
                      onVerResumo={irParaResumo}
                      temDados={temDados}
                    />
                  </div>
                </div>

                {/* Container da tabela com scroll horizontal */}
                <div className="border rounded-lg overflow-hidden bg-white relative">
                  <div className="overflow-auto max-h-[600px]">
                    <table className="w-full min-w-max table-fixed">
                      {/* Header fixo da tabela */}
                      <thead className="sticky top-[0px] bg-gray-50 z-20 border-b">
                        <tr>
                          <th className="w-[100px] min-w-[100px] p-3 text-left font-medium text-muted-foreground border-r">Produto</th>
                          <th className="w-[150px] min-w-[150px] p-3 text-left font-medium text-muted-foreground border-r">Tipo</th>
                          <th className="w-[160px] min-w-[160px] p-3 text-left font-medium text-muted-foreground border-r">Estoques</th>
                          {fornecedoresComProdutos.map((fornecedor, index) => (
                            <th 
                              key={fornecedor} 
                              className={`w-[100px] min-w-[100px] p-3 font-medium text-muted-foreground text-center ${index < fornecedoresComProdutos.length - 1 ? 'border-r' : ''}`}
                            >
                              {fornecedor}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      
                      {/* Conteúdo da tabela */}
                      <tbody className="bg-white">
                        {produtosFiltrados.map((item, index) => {
                          const precos = fornecedoresComProdutos.map(f => item.fornecedores[f]).filter(p => p !== null) as number[];
                          const menorPreco = precos.length > 0 ? Math.min(...precos) : null;
                          
                          return (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="w-[100px] min-w-[100px] p-3 font-medium border-r">
                                <span className="truncate block">{item.produto}</span>
                              </td>
                              <td className="w-[150px] min-w-[150px] p-3 border-r">
                                <Badge variant="secondary" className="truncate max-w-full">{item.tipo}</Badge>
                              </td>
                              <td className="w-[160px] min-w-[160px] p-3 border-r">
                                {obterEstoquesDisplay(item.produto, item.tipo)}
                              </td>
                              {fornecedoresComProdutos.map((fornecedor, fornIndex) => {
                                const preco = item.fornecedores[fornecedor];
                                const isMelhorPreco = preco === menorPreco && preco !== null;
                                const opcoesUnidade = obterOpcoesUnidade(item.produto, item.tipo);
                                
                                return (
                                  <FornecedorCell
                                    key={fornecedor}
                                    preco={preco}
                                    quantidade={item.quantidades[fornecedor] || 0}
                                    unidadePedido={item.unidadePedido[fornecedor] || 'Caixa'}
                                    isMelhorPreco={isMelhorPreco}
                                    opcoesUnidade={opcoesUnidade}
                                    onQuantidadeChange={(value) => atualizarQuantidade(index, fornecedor, value)}
                                    onUnidadeChange={(value) => atualizarUnidadePedido(index, fornecedor, value)}
                                  />
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                      
                      {/* Linha de Totais */}
                      <tfoot className="sticky bottom-0 bg-gray-100 border-t-2 z-10">
                        <tr className="font-semibold">
                          <td className="w-[100px] min-w-[100px] p-3 border-r">TOTAL GERAL</td>
                          <td className="w-[150px] min-w-[150px] p-3 border-r"></td>
                          <td className="w-[160px] min-w-[160px] p-3 border-r"></td>
                          {(() => {
                            const totais = fornecedoresComProdutos.map(f => calcularTotalFornecedor(f)).filter(t => t > 0);
                            const menorTotal = totais.length > 0 ? Math.min(...totais) : 0;
                            
                            return fornecedoresComProdutos.map((fornecedor, fornIndex) => {
                              const total = calcularTotalFornecedor(fornecedor);
                              const isMelhorTotal = total === menorTotal && total > 0;
                              
                              return (
                                <td 
                                  key={fornecedor} 
                                  className={`w-[100px] min-w-[100px] p-3 text-center ${fornIndex < fornecedoresComProdutos.length - 1 ? 'border-r' : ''}`}
                                >
                                  <div className={`text-base font-bold ${isMelhorTotal ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-blue-600'}`}>
                                    R$ {total.toFixed(2)}
                                    {isMelhorTotal && ' 🏆'}
                                  </div>
                                </td>
                              );
                            });
                          })()}
                        </tr>
                      </tfoot>
                    </table>
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
