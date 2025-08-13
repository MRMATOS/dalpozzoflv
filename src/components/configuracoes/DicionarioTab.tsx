import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { dicionarioProdutos } from '@/utils/productExtraction/dicionarioProdutos';
import { manutencaoCompletaSinonimos, sincronizarSinonimosDicionario } from '@/utils/productExtraction/synonymsManager';

interface ProdutoRow {
  id: string;
  produto: string;
  nome_variacao: string | null;
  produto_pai_id: string | null;
  ativo: boolean | null;
}

interface DivergenciaItem {
  tipo: 'produto' | 'variacao';
  cadastro: string;
  dicionario?: string;
  detalhe: string;
  produtoBase?: string;
}

const normalizarBase = (t: string) => t
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim();

const semTracos = (t: string) => normalizarBase(t).replace(/-/g, ' ');
const semEspacos = (t: string) => normalizarBase(t).replace(/\s+/g, '');

const classificarDiferenca = (a: string, b: string): string => {
  if (a === b) return 'igual';
  if (a.toLowerCase() === b.toLowerCase()) return 'maiúsculas/minúsculas';
  if (semTracos(a) === semTracos(b) && a !== b) return 'traços x espaços/case';
  if (semEspacos(a) === semEspacos(b) && a !== b) return 'espaços/case';
  return 'sem correspondência direta';
};

const DicionarioTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [divs, setDivs] = useState<DivergenciaItem[]>([]);

  const auditar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, produto, nome_variacao, produto_pai_id, ativo');
      if (error) throw error;

      const rows: ProdutoRow[] = (data || []).filter(r => r.ativo !== false) as any;
      const pais = rows.filter(r => !r.produto_pai_id);
      const filhosByPai = new Map<string, ProdutoRow[]>();
      rows.filter(r => r.produto_pai_id).forEach(r => {
        const arr = filhosByPai.get(r.produto_pai_id!) || [];
        arr.push(r);
        filhosByPai.set(r.produto_pai_id!, arr);
      });

      const dictKeys = Object.keys(dicionarioProdutos);
      const report: DivergenciaItem[] = [];

      // Mapear produtos pais por nome normalizado sem traços
      const paisMap = new Map<string, ProdutoRow>();
      pais.forEach(p => {
        paisMap.set(semTracos(p.produto || ''), p);
      });

      // Verificar: dicionário -> cadastro
      for (const key of dictKeys) {
        const match = paisMap.get(semTracos(key));
        if (!match) {
          report.push({ tipo: 'produto', cadastro: '(não encontrado)', dicionario: key, detalhe: 'Falta no Cadastro' });
        } else {
          const diff = classificarDiferenca(match.produto || '', key);
          if (diff !== 'igual') {
            report.push({ tipo: 'produto', cadastro: match.produto || '', dicionario: key, detalhe: diff });
          }

          // Comparar variações quando existir par
          const dictVariacoes = Object.keys(dicionarioProdutos[key] || {});
          const filhos = filhosByPai.get(match.id) || [];
          const filhosNomes = filhos.map(f => f.nome_variacao || '').filter(Boolean);

          // dicionário -> cadastro
          dictVariacoes.forEach(v => {
            const has = filhosNomes.some(n => semTracos(n) === semTracos(v));
            if (!has) {
              report.push({ tipo: 'variacao', cadastro: '(não encontrado)', dicionario: v, detalhe: 'Variação falta no Cadastro', produtoBase: key });
            } else {
              const found = filhosNomes.find(n => semTracos(n) === semTracos(v))!;
              const d = classificarDiferenca(found, v);
              if (d !== 'igual') {
                report.push({ tipo: 'variacao', cadastro: found, dicionario: v, detalhe: d, produtoBase: key });
              }
            }
          });

          // cadastro -> dicionário (extra no cadastro)
          filhosNomes.forEach(n => {
            const has = dictVariacoes.some(v => semTracos(v) === semTracos(n));
            if (!has) {
              report.push({ tipo: 'variacao', cadastro: n, dicionario: '(não encontrado)', detalhe: 'Variação não está no Dicionário', produtoBase: key });
            }
          });
        }
      }

      // cadastro -> dicionário (pais extras)
      pais.forEach(p => {
        const has = dictKeys.some(k => semTracos(k) === semTracos(p.produto || ''));
        if (!has) {
          report.push({ tipo: 'produto', cadastro: p.produto || '', dicionario: '(não encontrado)', detalhe: 'Produto não está no Dicionário' });
        }
      });

      setDivs(report);
      toast.success(`Auditoria concluída: ${report.length} divergência(s)`);
    } catch (e: any) {
      console.error(e);
      toast.error('Erro na auditoria: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const sincronizar = async () => {
    setLoading(true);
    try {
      const res = await manutencaoCompletaSinonimos();
      toast.success(`Sinônimos: +${res.sincronizacao.adicionados}, órfãos removidos: ${res.limpeza.removidos}`);
    } catch (e: any) {
      console.error(e);
      // fallback simples
      try {
        const res2 = await sincronizarSinonimosDicionario();
        toast.success(`Sinônimos adicionados: ${res2.adicionados}`);
      } catch (err: any) {
        toast.error('Erro ao sincronizar: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dicionário x Cadastro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <Button onClick={auditar} disabled={loading}>Auditar divergências</Button>
            <Button onClick={sincronizar} disabled={loading} variant="outline">Sincronizar sinônimos (dicionário → banco)</Button>
          </div>

          {divs.length > 0 && (
            <div className="overflow-auto border rounded-md">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Produto Base</th>
                    <th className="p-2">Cadastro</th>
                    <th className="p-2">Dicionário</th>
                    <th className="p-2">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {divs.map((d, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 capitalize">{d.tipo}</td>
                      <td className="p-2">{d.produtoBase || '-'}</td>
                      <td className="p-2">{d.cadastro}</td>
                      <td className="p-2">{d.dicionario || '-'}</td>
                      <td className="p-2">{d.detalhe}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DicionarioTab;
