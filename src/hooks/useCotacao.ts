import { useState, useEffect, useCallback } from 'react';
import { extrairProdutos } from '@/services/cotacao/extractionService';
import { useCotacaoPersistence } from '@/hooks/useCotacaoPersistence';
import { ProdutoExtraido, ItemTabelaComparativa } from '@/utils/productExtraction/types';
import { toast } from 'sonner';
import { useComparisonTable } from './useComparisonTable';

// Tipos para as props do hook
interface UseCotacaoProps {
  fornecedores: { id: string; nome: string }[];
  produtosDB: any[];
  requisicoes: any[];
}

export const useCotacao = ({ fornecedores, produtosDB, requisicoes }: UseCotacaoProps) => {
  const { 
    salvarCotacao, 
    restaurarUltimaCotacao, 
    novaCotacao: limparCotacao,
    dadosCarregados,
    isLoadingCotacao,
    cotacaoRestaurada,
    salvandoAutomaticamente
  } = useCotacaoPersistence();

  const [produtosExtraidos, setProdutosExtraidos] = useState<ProdutoExtraido[]>([]);
  const [fornecedoresProcessados, setFornecedoresProcessados] = useState<Set<string>>(new Set());
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<string | null>(null);
  const [mensagemAtual, setMensagemAtual] = useState('');
  const [dadosInicializados, setDadosInicializados] = useState(false);

  const {
    tabelaComparativa,
    setTabelaComparativa,
    atualizarQuantidade,
    atualizarUnidadePedido
  } = useComparisonTable({ produtosExtraidos, produtosDB });

  // Inicializar dados quando carregados do hook de persistência
  useEffect(() => {
    if (!isLoadingCotacao && dadosCarregados && !dadosInicializados) {
      setProdutosExtraidos(dadosCarregados.produtosExtraidos);
      setTabelaComparativa(dadosCarregados.tabelaComparativa);
      setFornecedoresProcessados(new Set(dadosCarregados.produtosExtraidos.map(p => p.fornecedor)));
      setDadosInicializados(true);
    }
  }, [isLoadingCotacao, dadosCarregados, dadosInicializados, setTabelaComparativa]);

  // Auto-salvar
  useEffect(() => {
    if (dadosInicializados && produtosExtraidos.length > 0 && !isLoadingCotacao) {
      const timeoutId = setTimeout(() => {
        salvarCotacao({
          produtosExtraidos,
          tabelaComparativa,
          fornecedoresProcessados,
        });
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [produtosExtraidos, tabelaComparativa, salvarCotacao, dadosInicializados, isLoadingCotacao, fornecedoresProcessados]);

  const selecionarFornecedor = useCallback((fornecedorId: string) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    if (!fornecedor) return;

    if (fornecedoresProcessados.has(fornecedor.nome)) {
      if (window.confirm(`Deseja apagar os produtos do ${fornecedor.nome}? Esta ação não pode ser desfeita.`)) {
        removerProdutosFornecedor(fornecedor.nome);
      }
      return;
    }
    setFornecedorSelecionado(fornecedorId);
    setMensagemAtual('');
  }, [fornecedores, fornecedoresProcessados]);

  const removerProdutosFornecedor = useCallback((nomeFornecedor: string) => {
    const novosExtraidos = produtosExtraidos.filter(p => p.fornecedor !== nomeFornecedor);
    setProdutosExtraidos(novosExtraidos);

    const novosProcessados = new Set(fornecedoresProcessados);
    novosProcessados.delete(nomeFornecedor);
    setFornecedoresProcessados(novosProcessados);

    toast.success(`Produtos de ${nomeFornecedor} removidos.`);
  }, [produtosExtraidos, fornecedoresProcessados]);

  const processarMensagem = useCallback(() => {
    if (!fornecedorSelecionado || !mensagemAtual.trim()) {
      toast.error('Selecione um fornecedor e cole a mensagem');
      return;
    }
    const fornecedor = fornecedores.find(f => f.id === fornecedorSelecionado);
    if (!fornecedor) return;

    const produtos = extrairProdutos(mensagemAtual, fornecedor.nome);
    if (produtos.length > 0) {
      const novosExtraidos = [...produtosExtraidos.filter(p => p.fornecedor !== fornecedor.nome), ...produtos];
      setProdutosExtraidos(novosExtraidos);
      setFornecedoresProcessados(prev => new Set(prev).add(fornecedor.nome));
      setFornecedorSelecionado(null);
      setMensagemAtual('');
      toast.success(`${produtos.length} produtos extraídos de ${fornecedor.nome}!`);
    } else {
      toast.error('Nenhum produto foi encontrado na mensagem.');
    }
  }, [fornecedorSelecionado, mensagemAtual, fornecedores, produtosExtraidos]);
  
  const handleRestaurarCotacao = async () => {
    const dadosRestaurados = await restaurarUltimaCotacao();
    if (dadosRestaurados) {
      setProdutosExtraidos(dadosRestaurados.produtosExtraidos);
      setTabelaComparativa(dadosRestaurados.tabelaComparativa);
      setFornecedoresProcessados(new Set(dadosRestaurados.produtosExtraidos.map(p => p.fornecedor)));
    }
  };

  const handleNovaCotacao = () => {
    const dadosLimpos = limparCotacao();
    setProdutosExtraidos(dadosLimpos.produtosExtraidos);
    setTabelaComparativa(dadosLimpos.tabelaComparativa);
    setFornecedoresProcessados(new Set());
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
    dadosInicializados,
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
  };
};
