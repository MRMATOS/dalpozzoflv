
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Save, X, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { validateInput } from '@/utils/inputValidation';
import { toast } from 'sonner';

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
    unidade: produto.unidade || 'Kg',
    media_por_caixa: produto.media_por_caixa || 20,
    ativo: produto.ativo
  });

  const mostrarMediaPorCaixa = (unidade: string | null | undefined) => {
    return unidade && unidade.toLowerCase() === 'caixa';
  };

  const handleSave = () => {
    try {
      // Validate inputs using security utility
      if (!produto.produto_pai_id) {
        validateInput.text(editValues.produto || '', 100);
      } else {
        validateInput.text(editValues.nome_variacao || '', 100);
      }
      validateInput.number(editValues.media_por_caixa || 0, 0.1, 1000);
    } catch (error: any) {
      toast.error(`Erro de validação: ${error.message}`);
      return;
    }

    console.log('Salvando produto:', produto.id, editValues);
    
    const updates: any = {
      unidade: editValues.unidade,
      ativo: editValues.ativo,
      media_por_caixa: mostrarMediaPorCaixa(editValues.unidade) ? editValues.media_por_caixa : null
    };

    // Se é produto principal, atualizar nome do produto
    if (!produto.produto_pai_id) {
      updates.produto = editValues.produto;
    } else {
      // Se é variação, atualizar nome da variação
      updates.nome_variacao = editValues.nome_variacao;
      // Manter o nome do produto pai
      updates.produto = produto.produto;
    }

    console.log('Updates finais:', updates);
    onUpdate(produto.id, updates);
    setEditingProduct(null);
  };

  const isEditing = editingProduct === produto.id;
  const isProdutoPrincipal = !produto.produto_pai_id;

  return (
    <div>
      <Card className={`mb-3 ${!isProdutoPrincipal ? 'bg-gray-50 border-gray-200' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Expand Button para produtos principais com variações */}
              {isProdutoPrincipal && produto.variacoes && produto.variacoes.length > 0 && (
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
                      placeholder={produto.produto_pai_id ? "Nome da variação" : "Nome do produto"}
                    />
                  ) : (
                    <div>
                      <h3 className={`font-semibold ${isProdutoPrincipal ? 'text-lg text-gray-900' : 'text-sm text-gray-600'}`}>
                        {produto.produto_pai_id ? produto.nome_variacao : produto.produto}
                      </h3>
                      {isProdutoPrincipal && produto.variacoes && produto.variacoes.length > 0 && (
                        <p className="text-xs text-gray-400">
                          {produto.variacoes.length} variação(ões)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Unidade e Média */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-32">
                    <label className={`text-xs ${isProdutoPrincipal ? 'text-gray-500' : 'text-gray-400'} block mb-1`}>Unidade</label>
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
                      <Badge variant="outline" className={`${isProdutoPrincipal ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'} text-xs`}>
                        {produto.unidade || 'Não definido'}
                      </Badge>
                    )}
                  </div>

                  {mostrarMediaPorCaixa(isEditing ? editValues.unidade : produto.unidade) && (
                    <div className="flex-1 min-w-32">
                      <label className={`text-xs ${isProdutoPrincipal ? 'text-gray-500' : 'text-gray-400'} block mb-1`}>Média (kg)</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValues.media_por_caixa}
                          onChange={(e) => setEditValues(prev => ({
                            ...prev,
                            media_por_caixa: parseFloat(e.target.value) || 0
                          }))}
                          className="h-8"
                          min="0"
                          step="0.1"
                        />
                      ) : (
                        <Badge variant="outline" className={`${isProdutoPrincipal ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'} text-xs`}>
                          {produto.media_por_caixa || 20} kg
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <label className={`text-xs ${isProdutoPrincipal ? 'text-gray-500' : 'text-gray-400'}`}>Status:</label>
                  {isEditing ? (
                    <Switch
                      checked={editValues.ativo}
                      onCheckedChange={(checked) => setEditValues(prev => ({ ...prev, ativo: checked }))}
                    />
                  ) : (
                    <Badge variant={produto.ativo ? "default" : "secondary"} className={`text-xs ${produto.ativo ? (isProdutoPrincipal ? "bg-green-600" : "bg-green-500") : ""}`}>
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
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingProduct(null);
                    // Resetar valores ao cancelar
                    setEditValues({
                      produto: produto.produto,
                      nome_variacao: produto.nome_variacao || '',
                      unidade: produto.unidade || 'Kg',
                      media_por_caixa: produto.media_por_caixa || 20,
                      ativo: produto.ativo
                    });
                  }} className="h-8">
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => {
                    console.log('Iniciando edição do produto:', produto.id);
                    setEditValues({
                      produto: produto.produto,
                      nome_variacao: produto.nome_variacao || '',
                      unidade: produto.unidade || 'Kg',
                      media_por_caixa: produto.media_por_caixa || 20,
                      ativo: produto.ativo
                    });
                    setEditingProduct(produto.id);
                  }} className="h-8">
                    <Edit className="w-4 h-4" />
                  </Button>
                  {isProdutoPrincipal && (
                    <Button variant="outline" size="sm" onClick={() => onAddVariation(produto.id)} className="h-8 bg-blue-50 hover:bg-blue-100">
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDelete(produto)} 
                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variações com separação visual clara - só aparecem quando expandido */}
      {isProdutoPrincipal && produto.variacoes && produto.variacoes.length > 0 && isExpanded && (
        <div className="mb-6">
          {/* Linha separadora sutil */}
          <div className="border-l-2 border-gray-200 ml-4 pl-8 pt-2">
            <div className="space-y-3">
              {produto.variacoes.map((variacao) => (
                <div key={variacao.id} className="relative">
                  {/* Linha conectora para cada variação */}
                  <div className="absolute -left-8 top-4 w-6 h-px bg-gray-200"></div>
                  <ProdutoCard
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdutoCard;
