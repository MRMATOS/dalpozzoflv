
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { FiltrosHistorico } from '@/hooks/useHistoricoConsolidado';

interface FiltroRapidoProps {
  filtros: FiltrosHistorico;
  onFiltroChange: (filtros: FiltrosHistorico) => void;
  onLimparFiltros: () => void;
}

const FiltroRapido: React.FC<FiltroRapidoProps> = ({ 
  filtros, 
  onFiltroChange, 
  onLimparFiltros 
}) => {
  const hoje = new Date();
  const hojeFmt = hoje.toISOString().split('T')[0];
  
  // Calcular datas para comparação
  const semanaPassada = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate()).toISOString().split('T')[0];
  
  // Função para detectar qual filtro está ativo
  const getFiltroAtivo = () => {
    if (filtros.dataInicio === hojeFmt && filtros.dataFim === hojeFmt) return 'hoje';
    if (filtros.dataInicio === semanaPassada && filtros.dataFim === hojeFmt) return 'semana';
    if (filtros.dataInicio === mesPassado && filtros.dataFim === hojeFmt) return 'mes';
    return null;
  };

  const filtroAtivo = getFiltroAtivo();

  const filtrosRapidos = [
    {
      label: 'Hoje',
      key: 'hoje',
      aplicar: () => {
        onFiltroChange({ ...filtros, dataInicio: hojeFmt, dataFim: hojeFmt });
      }
    },
    {
      label: 'Última Semana',
      key: 'semana',
      aplicar: () => {
        onFiltroChange({ 
          ...filtros, 
          dataInicio: semanaPassada,
          dataFim: hojeFmt
        });
      }
    },
    {
      label: 'Último Mês',
      key: 'mes',
      aplicar: () => {
        onFiltroChange({ 
          ...filtros, 
          dataInicio: mesPassado,
          dataFim: hojeFmt
        });
      }
    },
    {
      label: 'Só Cotações',
      key: 'cotacao',
      aplicar: () => onFiltroChange({ ...filtros, tipo: 'cotacao' })
    },
    {
      label: 'Só Pedidos Simples',
      key: 'simples',
      aplicar: () => onFiltroChange({ ...filtros, tipo: 'simples' })
    }
  ];

  const getFiltrosAtivos = () => {
    const ativos = [];
    if (filtros.dataInicio) ativos.push(`Data início: ${new Date(filtros.dataInicio).toLocaleDateString('pt-BR')}`);
    if (filtros.dataFim) ativos.push(`Data fim: ${new Date(filtros.dataFim).toLocaleDateString('pt-BR')}`);
    if (filtros.comprador) ativos.push(`Comprador: ${filtros.comprador}`);
    if (filtros.fornecedor) ativos.push(`Fornecedor: ${filtros.fornecedor}`);
    if (filtros.tipo) ativos.push(`Tipo: ${filtros.tipo}`);
    if (filtros.valorMin) ativos.push(`Valor mín: R$ ${filtros.valorMin}`);
    if (filtros.valorMax) ativos.push(`Valor máx: R$ ${filtros.valorMax}`);
    return ativos;
  };

  const filtrosAtivos = getFiltrosAtivos();

  return (
    <div className="space-y-4">
      {/* Filtros Rápidos */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">Filtros rápidos:</span>
        {filtrosRapidos.map((filtro) => (
          <Button
            key={filtro.key}
            variant={filtroAtivo === filtro.key ? "default" : "outline"}
            size="sm"
            onClick={filtro.aplicar}
            className="h-8"
          >
            {filtro.label}
          </Button>
        ))}
      </div>

      {/* Filtros Ativos */}
      {filtrosAtivos.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>
          {filtrosAtivos.map((filtro, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {filtro}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLimparFiltros}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default FiltroRapido;
