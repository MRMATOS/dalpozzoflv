
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Save, X, ChevronDown, ChevronRight, Plus } from 'lucide-react';

const unidades = ['Bandeja', 'Caixa', 'Gaiola', 'Gr', 'Kg', 'Maço', 'Pacote', 'Saco', 'Unidade'];

interface Produto {
  id: string;
  produto: string;
  nome_variacao?: string;
  unidade: string;
  ativo: boolean;
  media_por_caixa: number | null;
  produto_pai_id: string | null;
  ordem_exibicao: number;
}

interface ProdutoHierarquico extends Produto {
  variacoes?: Produto[];
  expandido?: boolean;
}

interface ProdutoCardProps {
  produto: ProdutoHierarquico;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: (produto: Produto) => void;
  onDelete: (produto: Produto) => void;
  onUpdate: (id: string, updates: any) => void;
  editingProduct: string | null;
  setEditingProduct: (id: string | null) => void;
  onAddVariation: (produtoId: string) => void;
}

const ProdutoCard = ({
  produto,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onUpdate,
  editingProduct,
  setEditingProduct,
  onAddVariation
}: ProdutoCardProps) => {
  const [editValues, setEditValues] = useState({
    produto: produto.produto,
    nome_variacao: produto.nome_variacao || '',
    unidade: produto.unidade,
    media_por_caixa: produto.media_por_caixa || 20,
    ativo: produto.ativo
  });

  const mostrarMediaPorCaixa = (unidade: string) => {
    return unidade.toLowerCase() === 'caixa';
  };

  const handleSave = () => {
    const updates: any = {
      produto: editValues.produto,
      unidade: editValues.unidade,
      ativo: editValues.ativo,
      media_por_caixa: mostrarMediaPorCaixa(editValues.unidade) ? editValues.media_por_caixa : null
    };

    if (produto.produto_pai_id) {
      updates.nome_variacao = editValues.nome_variacao;
    }

    onUpdate(produto.id, updates);
    setEditingProduct(null);
  };

  const isEditing = editingProduct === produto.id;

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Expand Button para produtos principais com variações */}
            {!produto.produto_pai_id && produto.variacoes && produto.variacoes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpanded}
                className="p-1 h-8 w-8 mt-1"
              >
                {isExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            )}

            <div className="flex-1 space-y-3">
              {/* Nome do produto */}
              <div>
                {isEditing ? (
                  <Input
                    value={produto.produto_pai_id ? editValues.nome_variacao : editValues.produto}
                    onChange={(e) => setEditValues(prev => ({
                      ...prev,
                      [produto.produto_pai_id ? 'nome_variacao' : 'produto']: e.target.value
                    }))}
                    className="font-medium"
                  />
                ) : (
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {produto.produto_pai_id ? produto.nome_variacao : produto.produto}
                    </h3>
                    {!produto.produto_pai_id && produto.variacoes && produto.variacoes.length > 0 && (
                      <p className="text-sm text-gray-500">
                        {produto.variacoes.length} variação(ões)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Unidade e Média */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-32">
                  <label className="text-xs text-gray-500 block mb-1">Unidade</label>
                  {isEditing ? (
                    <Select
                      value={editValues.unidade}
                      onValueChange={(value) => setEditValues(prev => ({
                        ...prev,
                        unidade: value,
                        media_por_caixa: value.toLowerCase() === 'caixa' ? (prev.media_por_caixa || 20) : 1
                      }))}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unidades.map((unidade) => (
                          <SelectItem key={unidade} value={unidade}>
                            {unidade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {produto.unidade}
                    </Badge>
                  )}
                </div>

                {mostrarMediaPorCaixa(isEditing ? editValues.unidade : produto.unidade) && (
                  <div className="flex-1 min-w-32">
                    <label className="text-xs text-gray-500 block mb-1">Média (kg)</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editValues.media_por_caixa}
                        onChange={(e) => setEditValues(prev => ({
                          ...prev,
                          media_por_caixa: parseFloat(e.target.value) || 0
                        }))}
                        className="h-8"
                      />
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        {produto.media_por_caixa || 20} kg
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-500">Status:</label>
                {isEditing ? (
                  <Switch
                    checked={editValues.ativo}
                    onCheckedChange={(checked) => setEditValues(prev => ({ ...prev, ativo: checked }))}
                  />
                ) : (
                  <Badge variant={produto.ativo ? "default" : "secondary"} className={produto.ativo ? "bg-green-600" : ""}>
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 ml-4">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 h-8">
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingProduct(null)} className="h-8">
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditValues({
                    produto: produto.produto,
                    nome_variacao: produto.nome_variacao || '',
                    unidade: produto.unidade,
                    media_por_caixa: produto.media_por_caixa || 20,
                    ativo: produto.ativo
                  });
                  setEditingProduct(produto.id);
                }} className="h-8">
                  <Edit className="w-4 h-4" />
                </Button>
                {!produto.produto_pai_id && (
                  <Button variant="outline" size="sm" onClick={() => onAddVariation(produto.id)} className="h-8 bg-blue-50 hover:bg-blue-100">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => onDelete(produto)} className="h-8 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Variações (se expandido) */}
        {isExpanded && produto.variacoes && produto.variacoes.length > 0 && (
          <div className="mt-4 pl-6 border-l-2 border-gray-100 space-y-3">
            {produto.variacoes.map((variacao) => (
              <ProdutoCard
                key={variacao.id}
                produto={variacao}
                isExpanded={false}
                onToggleExpanded={() => {}}
                onEdit={onEdit}
                onDelete={onDelete}
                onUpdate={onUpdate}
                editingProduct={editingProduct}
                setEditingProduct={setEditingProduct}
                onAddVariation={onAddVariation}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProdutoCard;
