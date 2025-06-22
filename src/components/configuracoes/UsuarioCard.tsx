
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Save, X } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  tipo: string;
  loja: string;
  codigo_acesso: string;
  ativo: boolean;
  criado_em?: string;
  ultimo_login?: string;
}

interface UsuarioCardProps {
  usuario: Usuario;
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  onUpdate: (id: string, updates: any) => void;
  editingUser: string | null;
  setEditingUser: (id: string | null) => void;
}

const UsuarioCard = ({
  usuario,
  onEdit,
  onDelete,
  onUpdate,
  editingUser,
  setEditingUser
}: UsuarioCardProps) => {
  const [editValues, setEditValues] = useState({
    nome: usuario.nome,
    tipo: usuario.tipo,
    loja: usuario.loja,
    codigo_acesso: usuario.codigo_acesso,
    ativo: usuario.ativo
  });

  const handleSave = () => {
    onUpdate(usuario.id, editValues);
    setEditingUser(null);
  };

  const isEditing = editingUser === usuario.id;

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
                />
              ) : (
                <h3 className="font-semibold text-lg text-gray-900">{usuario.nome}</h3>
              )}
            </div>

            {/* Tipo e Loja */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-32">
                <label className="text-xs text-gray-500 block mb-1">Tipo</label>
                {isEditing ? (
                  <Select
                    value={editValues.tipo}
                    onValueChange={(value) => setEditValues(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprador">Comprador</SelectItem>
                      <SelectItem value="estoque">Estoque</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {usuario.tipo}
                  </Badge>
                )}
              </div>

              <div className="flex-1 min-w-32">
                <label className="text-xs text-gray-500 block mb-1">Loja</label>
                {isEditing ? (
                  <Select
                    value={editValues.loja}
                    onValueChange={(value) => setEditValues(prev => ({ ...prev, loja: value }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Home">Home</SelectItem>
                      <SelectItem value="Campos">Campos</SelectItem>
                      <SelectItem value="BH">BH</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {usuario.loja}
                  </Badge>
                )}
              </div>
            </div>

            {/* Código de Acesso */}
            <div>
              <label className="text-xs text-gray-500 block mb-1">Código de Acesso</label>
              {isEditing ? (
                <Input
                  value={editValues.codigo_acesso}
                  onChange={(e) => setEditValues(prev => ({ ...prev, codigo_acesso: e.target.value }))}
                  className="h-8"
                />
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 font-mono">
                  {usuario.codigo_acesso}
                </Badge>
              )}
            </div>

            {/* Status e Data */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-500">Status:</label>
                {isEditing ? (
                  <Switch
                    checked={editValues.ativo}
                    onCheckedChange={(checked) => setEditValues(prev => ({ ...prev, ativo: checked }))}
                  />
                ) : (
                  <Badge variant={usuario.ativo ? "default" : "secondary"} className={usuario.ativo ? "bg-green-600" : ""}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                )}
              </div>
              
              {usuario.criado_em && (
                <div>
                  <label className="text-xs text-gray-500 block">Criado em</label>
                  <span className="text-xs text-gray-600">
                    {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}
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
                <Button variant="outline" size="sm" onClick={() => setEditingUser(null)} className="h-8">
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  setEditValues({
                    nome: usuario.nome,
                    tipo: usuario.tipo,
                    loja: usuario.loja,
                    codigo_acesso: usuario.codigo_acesso,
                    ativo: usuario.ativo
                  });
                  setEditingUser(usuario.id);
                }} className="h-8">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => onDelete(usuario)} className="h-8 text-red-600 hover:text-red-700">
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

export default UsuarioCard;
