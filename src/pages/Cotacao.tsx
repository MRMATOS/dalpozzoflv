
import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Download, Calculator, TestTube } from 'lucide-react';

const CotacaoProdutos = () => {
// Termos genéricos que podem ser removidos do texto antes de buscar no dicionário
const stripTokens = [
  'bdj', 'bandeja', 'cx', 'caixa', 'imp', 'imp.', 'importado',
  'tam', 'tam.', 'kg', 'kg.', 't', 'sc', 'un', 'und', 'unid'
];

// Dicionário estruturado hierarquicamente atualizado
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

  'couve': {
    'maço': ['couve maço']
  },

  'couve-flor': {
    'média': ['couve-flor média'],
    'graúda': ['couve-flor graúda']
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
  }
};

// Dados de exemplo para teste
const exemploMensagens = [
  {
    fornecedor: 'Frutas Silva',
    mensagem: `Bom dia! Segue nossa cotação:
Banana prata 3.50
Maçã gala 4.20
Tomate longa vida 2.80
Pimentão verde 5.50
Alface crespa 2.00
Mamão formosa 3.20
Laranja lima 2.50
Limão siciliano 6.80`
  },
  {
    fornecedor: 'Hortifruti Central',
    mensagem: `Preços de hoje:
- Banana prata: R$ 3.20
- Maçã gala: R$ 4.50
- Tomate longa vida: R$ 2.90
- Pimentão verde: R$ 5.20
- Alface crespa: R$ 1.80
- Mamão formosa: R$ 3.50
- Laranja lima: R$ 2.30
- Batata doce: R$ 3.80`
  },
  {
    fornecedor: 'Verde & Cia',
    mensagem: `Cotação atualizada:
BANANA PRATA - 3.80
MAÇÃ GALA - 4.10
TOMATE LONGA VIDA - 2.75
PIMENTÃO VERDE GRAÚDO - 5.80
ALFACE CRESPA - 2.10
MAMÃO PAPAYA TOP - 4.20
LARANJA LIMA - 2.60
BERINJELA - 4.50
UVA ITÁLIA - 8.90`
  }
];

const [mensagens, setMensagens] = useState([]);
const [fornecedores, setFornecedores] = useState([]);
const [produtosExtraidos, setProdutosExtraidos] = useState([]);
const [tabelaComparativa, setTabelaComparativa] = useState([]);
const [modoTeste, setModoTeste] = useState(false);

// Função para carregar dados de exemplo
const carregarDadosExemplo = () => {
  setMensagens(exemploMensagens);
  setModoTeste(true);
  setTimeout(() => {
    processarMensagensExemplo();
  }, 100);
};

// Função para extrair produtos de uma mensagem usando o novo dicionário hierárquico
const extrairProdutos = (mensagem, nomeFornecedor) => {
const linhas = mensagem.split('\n').filter(linha => linha.trim() !== '');
const produtos = [];

linhas.forEach(linha => {
// Regex para encontrar preços nos formatos: xx.xx, x.xx, xx,xx, x,xx, x,x, x.x
const regexPreco = /(\d{1,3}[.,]\d{1,2}|\d{1,3}[.,]\d{1})/g;
const precos = linha.match(regexPreco);

if (precos && precos.length > 0) {
const preco = precos[precos.length - 1].replace(',', '.'); // Último preço encontrado

// Encontrar o produto base e tipo correspondente usando o dicionário hierárquico
const linhaNormalizada = linha.toLowerCase();
let produtoEncontrado = null;
let tipoEncontrado = null;
let aliasEncontrado = '';
let melhorMatch = { length: 0, produto: null, tipo: null, alias: '' };

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

if (melhorMatch.produto) {
produtoEncontrado = melhorMatch.produto;
tipoEncontrado = melhorMatch.tipo;
aliasEncontrado = melhorMatch.alias;

// Extrair informações adicionais da linha (peso, qualidade, etc.)
let infoAdicional = linha;

// Remove o preço da linha
precos.forEach(p => {
infoAdicional = infoAdicional.replace(p, '');
});

// Remove o alias encontrado
const indexAlias = infoAdicional.toLowerCase().indexOf(aliasEncontrado.toLowerCase());
if (indexAlias !== -1) {
const antesAlias = infoAdicional.substring(0, indexAlias).trim();
const depoisAlias = infoAdicional.substring(indexAlias + aliasEncontrado.length).trim();
infoAdicional = (antesAlias + ' ' + depoisAlias).trim();
}

// Remove caracteres extras
infoAdicional = infoAdicional.replace(/^[:\-\s]+/, '').replace(/[:\-\s]+$/, '').trim();

// Monta o tipo final
let tipoFinal = tipoEncontrado;
if (infoAdicional && infoAdicional.length > 1) {
tipoFinal += (tipoEncontrado === 'padrão' ? '' : ' ') + infoAdicional;
}

// Remove o nome do produto do tipo se estiver presente
const nomeProdutoLowerCase = produtoEncontrado.toLowerCase();
const tipoFinalLowerCase = tipoFinal.toLowerCase();
if (tipoFinalLowerCase.includes(nomeProdutoLowerCase)) {
tipoFinal = tipoFinal.replace(new RegExp(produtoEncontrado, 'gi'), '').trim();
// Remove espaços duplos e limpa o início/fim
tipoFinal = tipoFinal.replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '');
// Se ficou vazio, volta para 'padrão'
if (!tipoFinal || tipoFinal.length === 0) {
tipoFinal = 'padrão';
}
}

produtos.push({
produto: produtoEncontrado.charAt(0).toUpperCase() + produtoEncontrado.slice(1),
tipo: tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1),
preco: parseFloat(preco),
fornecedor: nomeFornecedor,
linhaOriginal: linha,
aliasUsado: aliasEncontrado
});
}
}
});

return produtos;
};

// Adicionar mensagem de fornecedor
const adicionarMensagem = () => {
setMensagens([...mensagens, { fornecedor: '', mensagem: '' }]);
};

// Atualizar mensagem
const atualizarMensagem = (index, campo, valor) => {
const novasMensagens = [...mensagens];
novasMensagens[index][campo] = valor;
setMensagens(novasMensagens);
};

// Remover mensagem
const removerMensagem = (index) => {
const novasMensagens = mensagens.filter((_, i) => i !== index);
setMensagens(novasMensagens);
};

// Limpar tudo
const limparTudo = () => {
setMensagens([]);
setFornecedores([]);
setProdutosExtraidos([]);
setTabelaComparativa([]);
setModoTeste(false);
};

// Processar mensagens de exemplo
const processarMensagensExemplo = () => {
let todosProdutos = [];
let nomesFornecedores = [];

exemploMensagens.forEach(({ fornecedor, mensagem }) => {
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

// Criar tabela comparativa
criarTabelaComparativa(todosProdutos, nomesFornecedores);
};

// Processar todas as mensagens
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

// Criar tabela comparativa
criarTabelaComparativa(todosProdutos, nomesFornecedores);
};

// Criar tabela comparativa
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
// Inicializar todos os fornecedores com valores vazios
fornecedores.forEach(f => {
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

// Atualizar quantidade
const atualizarQuantidade = (produtoIndex, fornecedor, quantidade) => {
const novaTabela = [...tabelaComparativa];
novaTabela[produtoIndex].quantidades[fornecedor] = parseInt(quantidade) || 0;
setTabelaComparativa(novaTabela);
};

// Calcular total por fornecedor
const calcularTotalFornecedor = (fornecedor) => {
return tabelaComparativa.reduce((total, item) => {
const preco = item.fornecedores[fornecedor];
const quantidade = item.quantidades[fornecedor] || 0;
return total + ((preco !== null ? preco : 0) * quantidade);
}, 0);
};

return (
<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
<div className="max-w-7xl mx-auto">
<div className="bg-white rounded-lg shadow-xl p-8 mb-8">
<h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
<Calculator className="text-green-600" />
Sistema de Cotação de Produtos
</h1>
<p className="text-gray-600 mb-6">
Cole as mensagens dos fornecedores do WhatsApp para comparar preços automaticamente
</p>

{/* Botões de Teste */}
<div className="flex gap-4 mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
<button
onClick={carregarDadosExemplo}
className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
>
<TestTube size={20} />
Carregar Dados de Exemplo
</button>
<button
onClick={limparTudo}
className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
>
<Trash2 size={20} />
Limpar Tudo
</button>
</div>

{modoTeste && (
<div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
<h3 className="font-semibold text-green-800 mb-2">🧪 Modo Teste Ativo</h3>
<p className="text-green-700 text-sm">
Dados de exemplo carregados com 3 fornecedores. Experimente adicionar quantidades na tabela para ver os totais sendo calculados automaticamente!
</p>
</div>
)}

{/* Seção de Mensagens */}
<div className="mb-8">
<div className="flex justify-between items-center mb-4">
<h2 className="text-xl font-semibold text-gray-700">Mensagens dos Fornecedores</h2>
<button
onClick={adicionarMensagem}
className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
>
<Plus size={20} />
Adicionar Fornecedor
</button>
</div>

{mensagens.map((item, index) => (
<div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border">
<div className="flex gap-4 mb-3">
<input
type="text"
placeholder="Nome do Fornecedor"
value={item.fornecedor}
onChange={(e) => atualizarMensagem(index, 'fornecedor', e.target.value)}
className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
/>
<button
onClick={() => removerMensagem(index)}
className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
>
<Trash2 size={20} />
</button>
</div>
<textarea
placeholder="Cole aqui a mensagem do WhatsApp com os produtos..."
value={item.mensagem}
onChange={(e) => atualizarMensagem(index, 'mensagem', e.target.value)}
className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
/>
</div>
))}

{mensagens.length > 0 && !modoTeste && (
<button
onClick={processarMensagens}
className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold"
>
<Upload size={20} />
Processar Mensagens
</button>
)}
</div>

{/* Tabela Comparativa */}
{tabelaComparativa.length > 0 && (
<div className="mb-8">
<div className="flex justify-between items-center mb-4">
<h2 className="text-xl font-semibold text-gray-700">Comparação de Preços</h2>
<div className="text-sm text-gray-600">
Produtos encontrados: {tabelaComparativa.length} | Fornecedores: {fornecedores.length}
</div>
</div>
<div className="overflow-x-auto bg-white rounded-lg border">
<table className="w-full">
<thead className="bg-gray-100">
<tr>
<th className="px-4 py-3 text-left font-semibold text-gray-700">Produto</th>
<th className="px-4 py-3 text-left font-semibold text-gray-700">Tipo</th>
{fornecedores.map(fornecedor => (
<th key={fornecedor} className="px-4 py-3 text-center font-semibold text-gray-700 min-w-[150px]">
{fornecedor}
</th>
))}
</tr>
</thead>
<tbody>
{tabelaComparativa.map((item, index) => {
// Encontrar o menor preço para destacar
const precos = fornecedores
.map(f => item.fornecedores[f])
.filter(p => p !== null);
const menorPreco = Math.min(...precos);

return (
<tr key={index} className="border-t hover:bg-gray-50">
<td className="px-4 py-3 font-medium">{item.produto}</td>
<td className="px-4 py-3 text-sm text-gray-600">{item.tipo}</td>
{fornecedores.map(fornecedor => {
const preco = item.fornecedores[fornecedor];
const isMelhorPreco = preco === menorPreco && preco !== null;
return (
<td key={fornecedor} className="px-4 py-3 text-center">
{preco !== null ? (
<div className="space-y-2">
<div className={`font-semibold ${isMelhorPreco ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-gray-700'}`}>
R$ {preco.toFixed(2)}
{isMelhorPreco && ' 🏆'}
</div>
<input
type="number"
placeholder="Qtd"
min="0"
value={item.quantidades[fornecedor] || ''}
onChange={(e) => atualizarQuantidade(index, fornecedor, e.target.value)}
className="w-16 p-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
/>
</div>
) : (
<div className="text-gray-400">-</div>
)}
</td>
);
})}
</tr>
);
})}
{/* Linha de Totais */}
<tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
<td className="px-4 py-3" colSpan="2">TOTAL GERAL</td>
{fornecedores.map(fornecedor => {
const total = calcularTotalFornecedor(fornecedor);
const totais = fornecedores.map(f => calcularTotalFornecedor(f)).filter(t => t > 0);
const menorTotal = Math.min(...totais);
const isMelhorTotal = total === menorTotal && total > 0;
return (
<td key={fornecedor} className="px-4 py-3 text-center">
<div className={`text-lg font-bold ${isMelhorTotal ? 'text-green-600 bg-green-100 px-2 py-1 rounded' : 'text-blue-600'}`}>
R$ {total.toFixed(2)}
{isMelhorTotal && total > 0 && ' 🏆'}
</div>
</td>
);
})}
</tr>
</tbody>
</table>
</div>
</div>
)}

{/* Produtos Extraídos (Debug) */}
{produtosExtraidos.length > 0 && (
<details className="mb-6">
<summary className="cursor-pointer text-lg font-semibold text-gray-700 mb-4 hover:text-blue-600">
Produtos Extraídos ({produtosExtraidos.length}) - Clique para ver detalhes
</summary>
<div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
{produtosExtraidos.map((produto, index) => (
<div key={index} className="mb-2 p-2 bg-white rounded border-l-4 border-blue-500">
<div className="font-medium text-blue-700">{produto.fornecedor}</div>
<div className="text-sm text-gray-600">
<strong>Produto:</strong> {produto.produto} |
<strong> Tipo:</strong> {produto.tipo} |
<strong> Preço:</strong> R$ {produto.preco.toFixed(2)} |
<strong> Alias:</strong> {produto.aliasUsado}
</div>
<div className="text-xs text-gray-400 mt-1">
Original: {produto.linhaOriginal}
</div>
</div>
))}
</div>
</details>
)}

{/* Instruções */}
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
<h3 className="font-semibold text-blue-800 mb-2">Como usar:</h3>
<ol className="text-blue-700 text-sm space-y-1">
<li>1. Clique em "Carregar Dados de Exemplo" para testar com dados prontos</li>
<li>2. Ou clique em "Adicionar Fornecedor" para inserir manualmente</li>
<li>3. Digite o nome do fornecedor e cole a mensagem do WhatsApp</li>
<li>4. Clique em "Processar Mensagens" para extrair os produtos</li>
<li>5. Na tabela, insira as quantidades desejadas para cada produto</li>
<li>6. Compare os totais por fornecedor (menores preços são destacados com 🏆)</li>
</ol>
</div>

{/* Exemplo de Mensagem */}
<div className="mt-6 bg-gray-50 border-l-4 border-gray-400 p-4 rounded-lg">
<h3 className="font-semibold text-gray-800 mb-2">Exemplo de mensagem do WhatsApp:</h3>
<div className="bg-white p-3 rounded border text-sm text-gray-700 font-mono">
Bom dia! Segue nossa cotação:<br/>
Banana prata 3.50<br/>
Maçã gala 4.20<br/>
Tomate longa vida 2.80<br/>
Pimentão verde 5.50<br/>
Alface crespa 2.00
</div>
</div>
</div>
</div>
</div>
);
};

export default CotacaoProdutos;
