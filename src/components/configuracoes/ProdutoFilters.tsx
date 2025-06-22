
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface ProdutoFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  stockFilter: string;
  onStockFilterChange: (value: string) => void;
  mediaFilter: string;
  onMediaFilterChange: (value: string) => void;
}

const ProdutoFilters = ({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  stockFilter,
  onStockFilterChange,
  mediaFilter,
  onMediaFilterChange
}: ProdutoFiltersProps) => {
  return (
    <div className="bg-white p-4 rounded-lg border mb-6">
      <h3 className="font-medium mb-4 text-gray-900">Filtros</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar produto ou variação..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="principais">Apenas principais</SelectItem>
            <SelectItem value="variacoes">Apenas variações</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={stockFilter} onValueChange={onStockFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Estoque definido" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="com-estoque">Com unidade definida</SelectItem>
            <SelectItem value="sem-estoque">Sem unidade definida</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={mediaFilter} onValueChange={onMediaFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="Média por caixa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="com-media">Com média definida</SelectItem>
            <SelectItem value="sem-media">Sem média definida</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProdutoFilters;
