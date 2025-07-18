import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Table } from 'lucide-react';
import { PedidoConsolidado } from '@/hooks/useHistoricoConsolidado';
import { toast } from 'sonner';

interface ExportacaoHistoricoProps {
  dados: PedidoConsolidado[];
  filtrosAtivos: string;
}

const ExportacaoHistorico: React.FC<ExportacaoHistoricoProps> = ({ dados, filtrosAtivos }) => {
  const exportarCSV = () => {
    if (dados.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'Data',
      'Tipo',
      'Comprador',
      'Fornecedor',
      'Total Itens',
      'Valor Total',
      'Status'
    ];

    const csvContent = [
      headers.join(','),
      ...dados.map(pedido => [
        new Date(pedido.data).toLocaleDateString('pt-BR'),
        pedido.tipo,
        pedido.comprador || 'N/A',
        pedido.fornecedor || 'N/A',
        pedido.totalItens,
        `R$ ${pedido.valorTotal.toFixed(2)}`,
        pedido.status || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-consolidado-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Arquivo CSV exportado com sucesso');
  };

  const exportarJSON = () => {
    if (dados.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const dadosExportacao = {
      dataExportacao: new Date().toISOString(),
      filtrosAplicados: filtrosAtivos,
      totalRegistros: dados.length,
      dados: dados
    };

    const blob = new Blob([JSON.stringify(dadosExportacao, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-consolidado-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast.success('Arquivo JSON exportado com sucesso');
  };

  const gerarRelatorio = () => {
    if (dados.length === 0) {
      toast.error('Nenhum dado para gerar relatório');
      return;
    }

    const totalPedidos = dados.length;
    const valorTotal = dados.reduce((sum, p) => sum + p.valorTotal, 0);
    const mediaValor = valorTotal / totalPedidos;
    
    const fornecedores = [...new Set(dados.map(p => p.fornecedor).filter(Boolean))];
    const compradores = [...new Set(dados.map(p => p.comprador).filter(Boolean))];
    
    const relatorio = `
RELATÓRIO HISTÓRICO CONSOLIDADO
Gerado em: ${new Date().toLocaleString('pt-BR')}
Filtros aplicados: ${filtrosAtivos || 'Nenhum'}

RESUMO GERAL:
- Total de pedidos: ${totalPedidos}
- Valor total: R$ ${valorTotal.toFixed(2)}
- Valor médio por pedido: R$ ${mediaValor.toFixed(2)}
- Fornecedores únicos: ${fornecedores.length}
- Compradores únicos: ${compradores.length}

DETALHAMENTO POR TIPO:
${Object.entries(dados.reduce((acc, p) => {
  acc[p.tipo] = (acc[p.tipo] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([tipo, count]) => 
  `- ${tipo}: ${count} pedidos`
).join('\n')}

FORNECEDORES:
${fornecedores.map(f => `- ${f}`).join('\n')}

COMPRADORES:
${compradores.map(c => `- ${c}`).join('\n')}
    `.trim();

    const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-historico-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    
    toast.success('Relatório gerado com sucesso');
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportarCSV}
        className="flex items-center gap-2"
      >
        <Table className="h-4 w-4" />
        Exportar CSV
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={exportarJSON}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Exportar JSON
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={gerarRelatorio}
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Gerar Relatório
      </Button>
    </div>
  );
};

export default ExportacaoHistorico;