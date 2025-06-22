
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Save, X, Store } from 'lucide-react';

interface Loja {
  id: string;
  nome: string;
  ativo: boolean;
  criado_em?: string;
}

interface LojaCardProps {
  loja: Loja;
  onEdit: (loja: Loja) => void;
  onDelete: (loja: Loja) => void;
  onUpdate: (id: string, updates: any) => void;
  editingLoja: string | null;
  setEditingLoja: (id: string | null) => void;
}

const LojaCard = ({
  loja,
  onEdit,
  onDelete,
  onUpdate,
  editingLoja,
  setEditingLoja
}: LojaCardProps) => {
  const [editValues, setEditValues] = useState({
    nome: loja.nome,
    ativo: loja.ativo
  });

  const handleSave = () => {
    onUpdate(loja.id, editValues);
    setEditingLoja(null);
  };

  const isEditing = editingLoja === loja.id;

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
                  placeholder="Nome da loja"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-lg text-gray-900">{loja.nome}</h3>
                </div>
              )}
            </div>

            {/* Status e Data */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-500">Status:</label>
                {isEditing ? (
                  <Switch
                    checked={editValues.ativo}
                    onCheckedChange={(checked) => setEditValues(prev => ({ ...prev, ativo: checked }))}
                  />
                ) : (
                  <Badge variant={loja.ativo ? "default" : "secondary"} className={loja.ativo ? "bg-green-600" : ""}>
                    {loja.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                )}
              </div>
              
              {loja.criado_em && (
                <div>
                  <label className="text-xs text-gray-500 block">Criada em</label>
                  <span className="text-xs text-gray-600">
                    {new Date(loja.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                </div>
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
                <Button variant="outline" size="sm" onClick={() => setEditingLoja(null)} className="h-8">
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditValues({
                    nome: loja.nome,
                    ativo: loja.ativo
                  });
                  setEditingLoja(loja.id);
                }} className="h-8">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(loja)} className="h-8 text-red-600 hover:text-red-700">
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

export default LojaCard;
