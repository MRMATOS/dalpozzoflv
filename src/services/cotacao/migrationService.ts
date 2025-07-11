import { supabase } from '@/integrations/supabase/client';
import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';

interface ProdutoBanco {
  id: string;
  produto: string;
  nome_variacao: string | null;
  nome_base: string | null;
}

// Função para popular tabela de sinônimos com dados do dicionário
export const migrarDicionarioParaSinonimos = async (): Promise<void> => {
  try {
    console.log('🚀 Iniciando migração do dicionário para sinônimos...');
    
    // Verificar se já existem sinônimos
    const { data: existingSynonyms, error: checkError } = await supabase
      .from('sinonimos_produto')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.error('Erro ao verificar sinônimos existentes:', checkError);
      return;
    }
    
    if (existingSynonyms && existingSynonyms.length > 0) {
      console.log('✅ Sinônimos já existem no banco. Migração desnecessária.');
      return;
    }
    
    // Carregar produtos do banco
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('id, produto, nome_variacao, nome_base')
      .eq('ativo', true);
    
    if (produtosError) {
      console.error('Erro ao carregar produtos:', produtosError);
      return;
    }
    
    if (!produtos || produtos.length === 0) {
      console.log('⚠️ Nenhum produto ativo encontrado no banco.');
      return;
    }
    
    console.log(`📦 ${produtos.length} produtos carregados do banco.`);
    
    const sinonimosPararInserir: { produto_id: string; sinonimo: string }[] = [];
    
    for (const [nomeProduto, tipos] of Object.entries(dicionarioProdutos)) {
      // Encontra produto correspondente no banco
      const produto = produtos.find(p => {
        const nomeBase = p.nome_base?.toLowerCase().trim();
        const produtoNome = p.produto?.toLowerCase().trim();
        const nomeProdutoDict = nomeProduto.toLowerCase().trim();
        
        return nomeBase === nomeProdutoDict || produtoNome === nomeProdutoDict;
      });
      
      if (produto) {
        // Adiciona todos os aliases de todos os tipos
        for (const [tipoNome, aliases] of Object.entries(tipos)) {
          for (const alias of aliases) {
            if (alias && typeof alias === 'string' && alias.trim().length > 0) {
              sinonimosPararInserir.push({
                produto_id: produto.id,
                sinonimo: alias.toLowerCase().trim()
              });
            }
          }
        }
        console.log(`✅ Produto mapeado: ${nomeProduto} -> ${produto.nome_base || produto.produto}`);
      } else {
        console.log(`⚠️ Produto não encontrado no banco: ${nomeProduto}`);
      }
    }
    
    if (sinonimosPararInserir.length === 0) {
      console.log('⚠️ Nenhum sinônimo para inserir.');
      return;
    }
    
    console.log(`📝 Inserindo ${sinonimosPararInserir.length} sinônimos...`);
    
    // Remove duplicatas
    const sinonimosSemDuplicatas = sinonimosPararInserir.filter((item, index, self) => 
      index === self.findIndex(t => t.produto_id === item.produto_id && t.sinonimo === item.sinonimo)
    );
    
    console.log(`🔄 ${sinonimosSemDuplicatas.length} sinônimos únicos após remoção de duplicatas.`);
    
    // Insere em lotes para evitar timeout
    const batchSize = 50;
    let totalInseridos = 0;
    
    for (let i = 0; i < sinonimosSemDuplicatas.length; i += batchSize) {
      const batch = sinonimosSemDuplicatas.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('sinonimos_produto')
        .insert(batch)
        .select();
      
      if (error) {
        console.error(`❌ Erro ao inserir batch ${Math.floor(i/batchSize) + 1}:`, error);
        // Tenta inserir um por vez para identificar problemas
        for (const sinonimo of batch) {
          const { error: singleError } = await supabase
            .from('sinonimos_produto')
            .insert([sinonimo]);
          
          if (singleError) {
            console.error(`❌ Erro ao inserir sinonimo: ${sinonimo.sinonimo}`, singleError);
          } else {
            totalInseridos++;
          }
        }
      } else {
        totalInseridos += data?.length || 0;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1} inserido com sucesso (${data?.length || 0} registros)`);
      }
    }
    
    console.log(`🎉 Migração concluída! ${totalInseridos} sinônimos inseridos.`);
    
    // Verificar resultado final
    const { data: finalCount, error: countError } = await supabase
      .from('sinonimos_produto')
      .select('id', { count: 'exact' });
    
    if (!countError) {
      console.log(`📊 Total de sinônimos no banco: ${finalCount?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  }
};

// Função para verificar status da migração
export const verificarStatusMigracao = async (): Promise<{ totalSinonimos: number; migracaoNecessaria: boolean }> => {
  try {
    const { data, error } = await supabase
      .from('sinonimos_produto')
      .select('id', { count: 'exact' });
    
    if (error) {
      console.error('Erro ao verificar status:', error);
      return { totalSinonimos: 0, migracaoNecessaria: true };
    }
    
    const totalSinonimos = data?.length || 0;
    return {
      totalSinonimos,
      migracaoNecessaria: totalSinonimos === 0
    };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return { totalSinonimos: 0, migracaoNecessaria: true };
  }
};