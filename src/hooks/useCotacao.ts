
import { useState, useEffect, useCallback } from 'react';
import { useCotacaoPersistence } from '@/hooks/useCotacaoPersistence';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { toast } from 'sonner';
import { useComparisonTable } from './useComparisonTable';
import { AprendizadoService } from '@/services/cotacao/aprendizadoService';
import ExtractionWorker from '@/workers/extraction.worker.ts?worker';

interface UseCotacaoProps {
  fornecedores: { id: string; nome: string }[];
  produtosDB: any[];
  requisicoes: any[];
}

export const useCotacao = ({ fornecedores, produtosDB, requisicoes }: UseCotacaoProps) => {
  const { 
    salvarCotacao, 
    salvarRascunho,
    restaurarUltimaCotacao, 
    novaCotacao: limparCotacao,
    retrySync,
    isLoadingCotacao,
    cotacaoRestaurada,
    tipoCotacao,
    dadosCarregados,
    syncStatus,
    formatLastSyncTime
  } = useCotacaoPersistence();

  // Inicializar com dados carregados automaticamente
  const [produtosExtraidos, setProdutosExtraidos] = useState<ProdutoExtraido[]>([]);
  const [fornecedoresProcessados, setFornecedoresProcessados] = useState<Set<string>>(new Set());
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string | null>(null);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [textosPorFornecedor, setTextosPorFornecedor] = useState<{ [fornecedor: string]: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    tabelaComparativa,
    setTabelaComparativa,
    atualizarQuantidade,
    atualizarUnidadePedido,
    atualizarPreco
  } = useComparisonTable({ produtosExtraidos, produtosDB });

  // Carregar dados automaticamente apenas UMA vez
  useEffect(() => {
    if (dadosCarregados !== null && !isLoadingCotacao) {
      const produtosParaCarregar = dadosCarregados.produtosExtraidos || [];
      const tabelaParaCarregar = dadosCarregados.tabelaComparativa || [];
      
      setProdutosExtraidos(produtosParaCarregar);
      setTabelaComparativa(tabelaParaCarregar);
      
      const fornecedoresUnicos = new Set(produtosParaCarregar.map(p => p.fornecedor));
      setFornecedoresProcessados(fornecedoresUnicos);
    }
  }, [dadosCarregados, isLoadingCotacao]); // Removido setTabelaComparativa das dependências

  // Função para remover produtos de um fornecedor
  const removerProdutosFornecedor = useCallback((nomeFornecedor: string) => {
    try {
      console.log('Removendo produtos do fornecedor:', nomeFornecedor);
      const novosExtraidos = produtosExtraidos.filter(p => p.fornecedor !== nomeFornecedor);
      setProdutosExtraidos(novosExtraidos);

      const novosProcessados = new Set(fornecedoresProcessados);
      novosProcessados.delete(nomeFornecedor);
      setFornecedoresProcessados(novosProcessados);

      toast.success(`Produtos de ${nomeFornecedor} removidos.`);
    } catch (error) {
      console.error('Erro ao remover produtos do fornecedor:', error);
      toast.error('Erro ao remover produtos do fornecedor');
    }
  }, [produtosExtraidos, fornecedoresProcessados]);

  // Auto-salvar quando há mudanças significativas - COM DEBOUNCE
  useEffect(() => {
    if (dadosCarregados !== null && 
        !isLoadingCotacao && 
        !syncStatus.isSyncing && 
        produtosExtraidos.length > 0) {
      
      salvarCotacao({
        produtosExtraidos,
        tabelaComparativa,
        fornecedoresProcessados,
      });
    }
  }, [produtosExtraidos, tabelaComparativa]); // Dependências mínimas para evitar loops

  const selecionarFornecedor = useCallback((fornecedorId: string) => {
    try {
      console.log('Selecionando fornecedor:', fornecedorId);
      const fornecedor = fornecedores.find(f => f.id === fornecedorId);
      if (!fornecedor) {
        console.error('Fornecedor não encontrado:', fornecedorId);
        return;
      }

      if (fornecedoresProcessados.has(fornecedor.nome)) {
        if (window.confirm(`Deseja apagar os produtos do ${fornecedor.nome}? Esta ação não pode ser desfeita.`)) {
          removerProdutosFornecedor(fornecedor.nome);
        }
        return;
      }
      setFornecedorSelecionado(fornecedorId);
      setMensagemAtual('');
    } catch (error) {
      console.error('Erro ao selecionar fornecedor:', error);
      toast.error('Erro ao selecionar fornecedor');
    }
  }, [fornecedores, fornecedoresProcessados, removerProdutosFornecedor]);

  const processarMensagem = useCallback(() => {
    if (!fornecedorSelecionado || !mensagemAtual.trim()) {
      toast.error('Selecione um fornecedor e cole a mensagem');
      return;
    }
    if (isProcessing) {
      toast.info('Aguarde, processamento em andamento.');
      return;
    }
    const fornecedor = fornecedores.find(f => f.id === fornecedorSelecionado);
    if (!fornecedor) return;

    setIsProcessing(true);
    toast.info('Processando mensagem... Isso pode levar alguns segundos.');

    const worker = new ExtractionWorker();

    worker.onmessage = async (e: MessageEvent<{type: 'SUCCESS' | 'ERROR', payload: ProdutoExtraido[] | string}>) => {
      const { type, payload } = e.data;
      
      if (type === 'SUCCESS') {
        const produtos = payload as ProdutoExtraido[];
        if (produtos.length > 0) {
          // Aplicar aprendizado automático aos produtos extraídos
          const produtosComAprendizado = await AprendizadoService.aplicarAprendizado(produtos, fornecedor.nome);
          
          const novosExtraidos = [...produtosExtraidos.filter(p => p.fornecedor !== fornecedor.nome), ...produtosComAprendizado];
          setProdutosExtraidos(novosExtraidos);
          setFornecedoresProcessados(prev => new Set(prev).add(fornecedor.nome));
          
          // Salvar texto original para feedback
          setTextosPorFornecedor(prev => ({
            ...prev,
            [fornecedor.nome]: mensagemAtual
          }));
          
          setFornecedorSelecionado(null);
          setMensagemAtual('');
          toast.success(`${produtosComAprendizado.length} produtos extraídos de ${fornecedor.nome}!`);
        } else {
          toast.error('Nenhum produto foi encontrado na mensagem.');
        }
      } else {
        toast.error(`Erro ao processar mensagem: ${payload as string}`);
      }

      setIsProcessing(false);
      worker.terminate();
    };

    worker.onerror = (err) => {
        console.error('Erro no Web Worker:', err);
        toast.error('Ocorreu um erro inesperado no processamento.');
        setIsProcessing(false);
        worker.terminate();
    };

    worker.postMessage({
      mensagem: mensagemAtual,
      nomeFornecedor: fornecedor.nome
    });

  }, [fornecedorSelecionado, mensagemAtual, fornecedores, produtosExtraidos, isProcessing]);
  
  // Função para salvar rascunho manualmente
  const handleSalvarRascunho = useCallback(async () => {
    console.log('=== SALVANDO RASCUNHO MANUALMENTE ===');
    const sucesso = await salvarRascunho({
      produtosExtraidos,
      tabelaComparativa,
      fornecedoresProcessados,
    });
    return sucesso;
  }, [salvarRascunho, produtosExtraidos, tabelaComparativa, fornecedoresProcessados]);

  // Função para editar produto extraído
  const editarProdutoExtraido = useCallback((produtoEditado: ProdutoExtraido) => {
    const novosExtraidos = produtosExtraidos.map(produto => {
      // Usar ID único se disponível, senão usar combinação de campos
      const mesmoItem = produtoEditado.id 
        ? produto.id === produtoEditado.id
        : (produto.fornecedor === produtoEditado.fornecedor && 
           produto.linhaOriginal === produtoEditado.linhaOriginal && 
           produto.aliasUsado === produtoEditado.aliasUsado);
      
      if (mesmoItem) {
        return { ...produtoEditado, id: produto.id || produtoEditado.id };
      }
      return produto;
    });
    setProdutosExtraidos(novosExtraidos);
    toast.success(`Produto ${produtoEditado.produto} editado com sucesso!`);
  }, [produtosExtraidos]);

  // Função para deletar produto extraído
  const deletarProdutoExtraido = useCallback((produto: ProdutoExtraido) => {
    const novosExtraidos = produtosExtraidos.filter(p => 
      !(p.fornecedor === produto.fornecedor && 
        p.produto === produto.produto && 
        p.tipo === produto.tipo)
    );
    setProdutosExtraidos(novosExtraidos);
  }, [produtosExtraidos]);

  // Função para adicionar produto manualmente
  const adicionarProdutoManual = useCallback((
    fornecedor: string, 
    produto: string, 
    tipo: string, 
    preco: number, 
    produtoId?: string
  ) => {
    const novoProduto: ProdutoExtraido = {
      produto,
      tipo,
      preco,
      unidade: 'Caixa',
      fornecedor,
      confianca: 1.0, // Produto manual tem confiança máxima
      produtoId: produtoId || undefined,
      linhaOriginal: 'Adicionado manualmente',
      aliasUsado: produto,
      origem: 'manual' as const
    };

    // Verificar se produto já existe para este fornecedor
    const produtoExistente = produtosExtraidos.find(p => 
      p.fornecedor === fornecedor && 
      p.produto === produto && 
      p.tipo === tipo
    );

    if (produtoExistente) {
      // Atualizar produto existente
      editarProdutoExtraido(novoProduto);
    } else {
      // Adicionar novo produto
      const novosExtraidos = [...produtosExtraidos, novoProduto];
      setProdutosExtraidos(novosExtraidos);
      
      // Marcar fornecedor como processado se ainda não estiver
      if (!fornecedoresProcessados.has(fornecedor)) {
        setFornecedoresProcessados(prev => new Set(prev).add(fornecedor));
      }
    }
  }, [produtosExtraidos, fornecedoresProcessados, editarProdutoExtraido]);

  const handleRestaurarCotacao = async () => {
    console.log('=== RESTAURANDO COTAÇÃO ===');
    const dadosRestaurados = await restaurarUltimaCotacao();
    if (dadosRestaurados) {
      setProdutosExtraidos(dadosRestaurados.produtosExtraidos);
      setTabelaComparativa(dadosRestaurados.tabelaComparativa);
      setFornecedoresProcessados(new Set(dadosRestaurados.produtosExtraidos.map(p => p.fornecedor)));
    }
  };

  const handleNovaCotacao = async () => {
    console.log('=== CRIANDO NOVA COTAÇÃO ===');
    const dadosLimpos = await limparCotacao();
    
    // Limpar todos os estados locais
    setProdutosExtraidos(dadosLimpos.produtosExtraidos);
    setTabelaComparativa(dadosLimpos.tabelaComparativa);
    setFornecedoresProcessados(new Set());
    setTextosPorFornecedor({});
    setFornecedorSelecionado(null);
    setMensagemAtual('');
  };
  
  const calcularPercentualSuprimento = (loja: string) => {
    const requisicoesDaLoja = requisicoes.filter(req => req.loja === loja);
    if (requisicoesDaLoja.length === 0) return 0;
    let totalRequisitado = 0;
    let totalSuprido = 0;
    requisicoesDaLoja.forEach(requisicao => {
      totalRequisitado += requisicao.quantidade_calculada;
      const produtoTabela = tabelaComparativa.find(item => {
        const produtoRequisitado = requisicao.produto_nome.toLowerCase().trim();
        const produtoTabelaNome = item.produto.toLowerCase().trim();
        const tipoTabela = item.tipo.toLowerCase().trim();
        return produtoRequisitado.includes(produtoTabelaNome) || produtoTabelaNome.includes(produtoRequisitado) ||
               produtoRequisitado.includes(tipoTabela) || tipoTabela.includes(produtoRequisitado);
      });
      if (produtoTabela) {
        const quantidadesTotais = Object.values(produtoTabela.quantidades).reduce((sum, qtd) => sum + qtd, 0);
        totalSuprido += Math.min(quantidadesTotais, requisicao.quantidade_calculada);
      }
    });
    return totalRequisitado > 0 ? Math.round((totalSuprido / totalRequisitado) * 100) : 0;
  };
  
  return {
    isLoading: isLoadingCotacao,
    dadosInicializados: !isLoadingCotacao, // True quando carregamento terminar
    produtosExtraidos,
    tabelaComparativa,
    fornecedoresProcessados,
    fornecedorSelecionado,
    mensagemAtual,
    cotacaoRestaurada,
    tipoCotacao,
    syncStatus,
    isProcessing,
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
  };
};
