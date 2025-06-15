
import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';
import { ProdutoExtraido } from '@/utils/productExtraction/types';

export const extrairProdutos = (mensagem: string, nomeFornecedor: string): ProdutoExtraido[] => {
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
