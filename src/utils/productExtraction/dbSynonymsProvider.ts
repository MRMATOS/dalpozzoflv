import { supabase } from '@/integrations/supabase/client';

export interface DbMappingEntry {
  alias: string;
  aliasNormalizado: string;
  produto: string;
  tipo: string;
}

// Normalização compatível com extractionService
const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

let cache: { data: DbMappingEntry[]; time: number } | null = null;
const TTL = 60 * 60 * 1000; // 1h

export const getDbSynonymsMappings = async (): Promise<DbMappingEntry[]> => {
  const now = Date.now();
  if (cache && now - cache.time < TTL) return cache.data;

  const { data, error } = await supabase
    .from('sinonimos_produto')
    .select(`sinonimo, produtos:produto_id(produto, nome_variacao, produto_pai_id, ativo)`) as any;

  if (error) {
    console.warn('[DB Synonyms] Falha ao buscar sinônimos, usando vazio:', error.message);
    cache = { data: [], time: now };
    return cache.data;
  }

  const list: DbMappingEntry[] = [];
  (data || []).forEach((row: any) => {
    const prod = row.produtos;
    if (!prod || prod.ativo === false) return;
    const produtoNome: string = (prod.produto || '').toString().toLowerCase();
    const tipoNome: string = (prod.produto_pai_id ? (prod.nome_variacao || '') : '').toString().toLowerCase();

    const alias: string = row.sinonimo?.toString() || '';
    if (!alias) return;
    list.push({
      alias: alias.toLowerCase(),
      aliasNormalizado: normalizarTexto(alias),
      produto: produtoNome || '',
      tipo: tipoNome || ''
    });
  });

  // Ordenar por comprimento do alias normalizado (maior primeiro)
  list.sort((a, b) => b.aliasNormalizado.length - a.aliasNormalizado.length);
  cache = { data: list, time: now };
  return list;
};
