
import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

interface MapeamentoProduto {
  alias: string;
  produto: string;
  tipo: string;
}

// Cache para o dicionário otimizado
let dicionarioOtimizado: MapeamentoProduto[] | null = null;

// Função que cria e armazena em cache uma versão otimizada do dicionário
const getDicionarioOtimizado = (): MapeamentoProduto[] => {
  if (dicionarioOtimizado) {
    return dicionarioOtimizado;
  }

  const listaMapeamentos: MapeamentoProduto[] = [];

  for (const [nomeProduto, tipos] of Object.entries(dicionarioProdutos)) {
    for (const [nomeTipo, aliases] of Object.entries(tipos)) {
      for (const alias of aliases) {
        listaMapeamentos.push({
          alias: alias.toLowerCase(),
          produto: nomeProduto,
          tipo: nomeTipo,
        });
      }
    }
  }

  // Ordena por comprimento do alias, do maior para o menor.
  // Isso garante que "tomate longa vida" seja encontrado antes de "tomate".
  listaMapeamentos.sort((a, b) => b.alias.length - a.alias.length);
  
  dicionarioOtimizado = listaMapeamentos;
  console.log('Dicionário de produtos otimizado e cacheado.');
  return dicionarioOtimizado;
};

export const extrairProdutos = (mensagem: string, nomeFornecedor: string): ProdutoExtraido[] => {
  const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
  const produtos: ProdutoExtraido[] = [];
  const dicionario = getDicionarioOtimizado(); // Usa a versão otimizada

  linhas.forEach(linha => {
    // Regex para encontrar preços nos formatos: xx.xx, x.xx, xx,xx, x,xx, x,x, x.x
    const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
    const precos = linha.match(regexPreco);

    if (precos && precos.length > 0) {
      const preco = precos[precos.length - 1].replace(',', '.'); // Último preço encontrado
      const linhaNormalizada = linha.toLowerCase();
      
      let produtoEncontrado: { produto: string; tipo: string; alias: string; } | null = null;

      // Loop único no dicionário otimizado. Muito mais rápido.
      for (const mapeamento of dicionario) {
        if (linhaNormalizada.includes(mapeamento.alias)) {
          produtoEncontrado = {
            produto: mapeamento.produto,
            tipo: mapeamento.tipo,
            alias: mapeamento.alias,
          };
          // Como o dicionário está ordenado, o primeiro match é o mais específico.
          break; 
        }
      }

      if (produtoEncontrado) {
        // O restante da lógica permanece o mesmo
        let infoAdicional = linha;

        precos.forEach(p => {
          infoAdicional = infoAdicional.replace(p, '');
        });

        const indexAlias = infoAdicional.toLowerCase().indexOf(produtoEncontrado.alias);
        if (indexAlias !== -1) {
          const antesAlias = infoAdicional.substring(0, indexAlias).trim();
          const depoisAlias = infoAdicional.substring(indexAlias + produtoEncontrado.alias.length).trim();
          infoAdicional = (antesAlias + ' ' + depoisAlias).trim();
        }

        infoAdicional = infoAdicional.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();

        let tipoFinal = produtoEncontrado.tipo;
        if (infoAdicional && infoAdicional.length > 1) {
          tipoFinal += (produtoEncontrado.tipo === 'padrão' ? '' : ' ') + infoAdicional;
        }

        const nomeProdutoLowerCase = produtoEncontrado.produto.toLowerCase();
        const tipoFinalLowerCase = tipoFinal.toLowerCase();
        if (tipoFinalLowerCase.includes(nomeProdutoLowerCase)) {
          tipoFinal = tipoFinal.replace(new RegExp(produtoEncontrado.produto, 'gi'), '').trim();
          tipoFinal = tipoFinal.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
          if (!tipoFinal || tipoFinal.length === 0) {
            tipoFinal = 'padrão';
          }
        }

        produtos.push({
          produto: produtoEncontrado.produto.charAt(0).toUpperCase() + produtoEncontrado.produto.slice(1),
          tipo: tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
          preco: parseFloat(preco),
          fornecedor: nomeFornecedor,
          linhaOriginal: linha,
          aliasUsado: produtoEncontrado.alias,
          origem: 'dicionario' as const
        });
      }
    }
  });

  return produtos;
};
