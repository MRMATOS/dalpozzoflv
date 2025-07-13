
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Save, X, Phone } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { validateInput } from '@/utils/inputValidation';
import { toast } from 'sonner';

interface Fornecedor {
  id: string;
  nome: string;
  telefone?: string;
  status_tipo?: string;
}

interface FornecedorCardProps {
  fornecedor: Fornecedor;
  onEdit: (fornecedor: Fornecedor) => void;
  onDelete: (fornecedor: Fornecedor) => void;
  onUpdate: (id: string, updates: any) => void;
  editingFornecedor: string | null;
  setEditingFornecedor: (id: string | null) => void;
}

const FornecedorCard = ({
  fornecedor,
  onEdit,
  onDelete,
  onUpdate,
  editingFornecedor,
  setEditingFornecedor
}: FornecedorCardProps) => {
  const [editValues, setEditValues] = useState({
    nome: fornecedor.nome,
    telefone: fornecedor.telefone || '',
    status_tipo: fornecedor.status_tipo || 'Cotação e Pedido'
  });

  const handleSave = () => {
    try {
      // Validate inputs using security utility
      validateInput.text(editValues.nome || '', 100);
      if (editValues.telefone) {
        validateInput.text(editValues.telefone, 20);
      }
    } catch (error: any) {
      toast.error(`Erro de validação: ${error.message}`);
      return;
    }

    onUpdate(fornecedor.id, editValues);
    setEditingFornecedor(null);
  };

  const isEditing = editingFornecedor === fornecedor.id;

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Nome */}
            <div>
              {isEditing ? (
                <Input
                  value={editValues.nome}
                  onChange={(e) => setEditValues(prev => ({ ...prev, nome: e.target.value }))}
                  className="font-medium"
                  placeholder="Nome do fornecedor"
                />
              ) : (
                <h3 className="font-semibold text-lg text-gray-900">{fornecedor.nome}</h3>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Telefone (WhatsApp)</label>
              {isEditing ? (
                <Input
                  value={editValues.telefone}
                  onChange={(e) => setEditValues(prev => ({ ...prev, telefone: e.target.value }))}
                  className="h-8"
                  placeholder="(XX) XXXXX-XXXX"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  {fornecedor.telefone ? (
                    <>
                      <Phone className="w-4 h-4 text-green-600" />
                      <Badge variant="outline" className="bg-green-50 text-green-700 font-mono">
                        {fornecedor.telefone}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500">
                      Não informado
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Status Tipo */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Mostrar fornecedor em:</label>
              {isEditing ? (
                <Select
                  value={editValues.status_tipo}
                  onValueChange={(value) => setEditValues(prev => ({ ...prev, status_tipo: value }))}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cotação">Cotação</SelectItem>
                    <SelectItem value="Pedido Simples">Pedido Simples</SelectItem>
                    <SelectItem value="Cotação e Pedido">Cotação e Pedido</SelectItem>
                    <SelectItem value="Desativado">Desativado</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge 
                  variant="outline" 
                  className={
                    fornecedor.status_tipo === 'Cotação' ? 'bg-purple-50 text-purple-700' :
                    fornecedor.status_tipo === 'Pedido Simples' ? 'bg-amber-50 text-amber-700' :
                    fornecedor.status_tipo === 'Desativado' ? 'bg-red-50 text-red-700' :
                    'bg-blue-50 text-blue-700'
                  }
                >
                  {fornecedor.status_tipo || 'Cotação e Pedido'}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 ml-4">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave} className="bg-green-600 hover:bg-green-700 h-8">
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingFornecedor(null)} className="h-8">
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditValues({
                    nome: fornecedor.nome,
                    telefone: fornecedor.telefone || '',
                    status_tipo: fornecedor.status_tipo || 'Cotação e Pedido'
                  });
                  setEditingFornecedor(fornecedor.id);
                }} className="h-8">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(fornecedor)} className="h-8 text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FornecedorCard;
