
import { extrairProdutos } from '../services/cotacao/extractionService';
import { ProdutoExtraido } from '../utils/productExtraction/types';

interface WorkerEventData {
  mensagem: string;
  nomeFornecedor: string;
}

self.onmessage = (e: MessageEvent<WorkerEventData>) => {
  const { mensagem, nomeFornecedor } = e.data;
  console.log('Worker: Recebida mensagem para processar.');

  try {
    const produtos = extrairProdutos(mensagem, nomeFornecedor);
    console.log(`Worker: ${produtos.length} produtos extraídos.`);
    self.postMessage({ type: 'SUCCESS', payload: produtos });
  } catch (error) {
    console.error('Worker: Erro ao extrair produtos.', error);
    self.postMessage({ type: 'ERROR', payload: (error as Error).message });
  }
};

export {};
