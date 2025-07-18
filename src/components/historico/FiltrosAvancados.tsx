
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Search, X } from 'lucide-react';
import { FiltrosHistorico } from '@/hooks/useHistoricoConsolidado';

interface FiltrosAvancadosProps {
  filtros: FiltrosHistorico;
  onFiltrosChange: (filtros: FiltrosHistorico) => void;
  onBuscar: () => void;
  onLimpar: () => void;
  compradores: Array<{ id: string; nome: string; loja: string }>;
  isComprador: boolean;
  isMaster: boolean;
}

const FiltrosAvancados: React.FC<FiltrosAvancadosProps> = ({
  filtros,
  onFiltrosChange,
  onBuscar,
  onLimpar,
  compradores,
  isComprador,
  isMaster
}) => {
  const handleFiltroChange = (campo: keyof FiltrosHistorico, valor: string) => {
    onFiltrosChange({
      ...filtros,
      [campo]: valor
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tipo de Pedido */}
          <div className="space-y-2">
            <Label>Tipo de Pedido</Label>
            <Select 
              value={filtros.tipoPedido} 
              onValueChange={(value: 'todos' | 'cotacao' | 'simples') => handleFiltroChange('tipoPedido', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="cotacao">Pedidos de Cotação</SelectItem>
                <SelectItem value="simples">Pedidos Simples</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Comprador - apenas para compradores e masters */}
          {(isComprador || isMaster) && (
            <div className="space-y-2">
              <Label>Comprador</Label>
              <Select 
                value={filtros.comprador} 
                onValueChange={(value) => handleFiltroChange('comprador', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meus">Meus pedidos</SelectItem>
                  <SelectItem value="todos">Todos os pedidos</SelectItem>
                  {compradores.map((comprador) => (
                    <SelectItem key={comprador.id} value={comprador.id}>
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
              value={filtros.fornecedor}
              onChange={(e) => handleFiltroChange('fornecedor', e.target.value)}
            />
          </div>

          {/* Produto */}
          <div className="space-y-2">
            <Label>Produto</Label>
            <Input
              placeholder="Nome do produto..."
              value={filtros.produto}
              onChange={(e) => handleFiltroChange('produto', e.target.value)}
            />
          </div>

          {/* Data Início */}
          <div className="space-y-2">
            <Label>Data Início</Label>
            <Input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
            />
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label>Data Fim</Label>
            <Input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
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
