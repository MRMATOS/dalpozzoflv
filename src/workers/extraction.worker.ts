
import { extrairProdutosAvancado } from '../services/cotacao/advancedExtractionService';
import { ProdutoExtraido } from '../utils/productExtraction/types';

interface WorkerEventData {
  mensagem: string;
  nomeFornecedor: string;
}

self.onmessage = async (e: MessageEvent<WorkerEventData>) => {
  const { mensagem, nomeFornecedor } = e.data;
  console.log('Worker: Recebida mensagem para processar com sistema avançado.');

  try {
    const produtos = await extrairProdutosAvancado(mensagem, nomeFornecedor);
    console.log(`Worker: ${produtos.length} produtos extraídos (incluindo não identificados).`);
    self.postMessage({ type: 'SUCCESS', payload: produtos });
  } catch (error) {
    console.error('Worker: Erro ao extrair produtos.', error);
    self.postMessage({ type: 'ERROR', payload: (error as Error).message });
  }
};

export {};
