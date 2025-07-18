import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import { FiltrosHistorico } from '@/hooks/useHistoricoConsolidado';

interface FiltrosAvancadosProps {
  filtros: FiltrosHistorico;
  onFiltrosChange: (filtros: FiltrosHistorico) => void;
  onBuscar: () => void;
  onLimpar: () => void;
  compradores: Array<{ id: string; nome: string; loja: string }>;
  isComprador?: boolean;
  isMaster?: boolean;
}

const FiltrosAvancados: React.FC<FiltrosAvancadosProps> = ({
  filtros,
  onFiltrosChange,
  onBuscar,
  onLimpar,
  compradores,
  isComprador = false,
  isMaster = false
}) => {
  const handleFiltroChange = (campo: keyof FiltrosHistorico, valor: any) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  const getFiltrosAtivos = () => {
    const ativos = [];
    if (filtros.dataInicio) ativos.push('Data Início');
    if (filtros.dataFim) ativos.push('Data Fim');
    if (filtros.comprador && filtros.comprador !== 'meus') ativos.push('Comprador');
    if (filtros.fornecedor) ativos.push('Fornecedor');
    if (filtros.tipo) ativos.push('Tipo');
    if (filtros.valorMin) ativos.push('Valor Mínimo');
    if (filtros.valorMax) ativos.push('Valor Máximo');
    return ativos;
  };

  const filtrosAtivos = getFiltrosAtivos();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Pesquisa
          {filtrosAtivos.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {filtrosAtivos.length} ativo{filtrosAtivos.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tipo de Pedido */}
          <div className="space-y-2">
            <Label>Tipo de Pedido</Label>
            <Select 
              value={filtros.tipo || 'todos'} 
              onValueChange={(value) => handleFiltroChange('tipo', value === 'todos' ? undefined : value as 'cotacao' | 'simples')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="cotacao">Cotações</SelectItem>
                <SelectItem value="simples">Pedidos Simples</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comprador (apenas para master ou se permitido) */}
          {(isMaster || isComprador) && (
            <div className="space-y-2">
              <Label>Comprador</Label>
              <Select 
                value={filtros.comprador || 'meus'} 
                onValueChange={(value) => handleFiltroChange('comprador', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meus">Meus Pedidos</SelectItem>
                  {isMaster && <SelectItem value="todos">Todos os Compradores</SelectItem>}
                  {compradores.map((comprador) => (
                    <SelectItem key={comprador.id} value={comprador.nome}>
                      {comprador.nome} ({comprador.loja})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Fornecedor */}
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Input
              placeholder="Nome do fornecedor..."
              value={filtros.fornecedor || ''}
              onChange={(e) => handleFiltroChange('fornecedor', e.target.value)}
            />
          </div>

          {/* Data Início */}
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={filtros.dataInicio || ''}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Data Fim */}
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={filtros.dataFim || ''}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
            />
          </div>

          {/* Valor Mínimo */}
          <div className="space-y-2">
            <Label>Valor Mínimo (R$)</Label>
            <Input
              type="number"
              placeholder="0,00"
              step="0.01"
              value={filtros.valorMin || ''}
              onChange={(e) => handleFiltroChange('valorMin', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>

          {/* Valor Máximo */}
          <div className="space-y-2">
            <Label>Valor Máximo (R$)</Label>
            <Input
              type="number"
              placeholder="999999,99"
              step="0.01"
              value={filtros.valorMax || ''}
              onChange={(e) => handleFiltroChange('valorMax', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Filtros Ativos */}
        {filtrosAtivos.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Filtros ativos:</span>
              {filtrosAtivos.map((filtro) => (
                <Badge key={filtro} variant="secondary" className="text-xs">
                  {filtro}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={onBuscar} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar
          </Button>
          <Button variant="outline" onClick={onLimpar} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiltrosAvancados;