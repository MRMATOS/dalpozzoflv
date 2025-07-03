
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Save, X, Truck } from 'lucide-react';
import { useLojas } from '@/hooks/useLojas';
import { validateInput } from '@/utils/inputValidation';
import { toast } from 'sonner';

interface Usuario {
  id: string;
  nome: string;
  tipo: string;
  loja: string;
  codigo_acesso: string;
  ativo: boolean;
  aprovado?: boolean;
  criado_em?: string;
  ultimo_login?: string;
}

interface UsuarioCardProps {
  usuario: Usuario;
  onEdit: (usuario: Usuario) => void;
  onDelete: (usuario: Usuario) => void;
  onUpdate: (id: string, updates: any) => void;
  onApprove: (id: string) => void;
  editingUser: string | null;
  setEditingUser: (id: string | null) => void;
}

const UsuarioCard = ({
  usuario,
  onEdit,
  onDelete,
  onUpdate,
  onApprove,
  editingUser,
  setEditingUser
}: UsuarioCardProps) => {
  const { lojas, cdLoja } = useLojas();
  const [editValues, setEditValues] = useState({
    nome: usuario.nome,
    tipo: usuario.tipo,
    loja: usuario.loja,
    codigo_acesso: usuario.codigo_acesso,
    ativo: usuario.ativo
  });

  const handleSave = () => {
    try {
      // Validate inputs using security utility
      validateInput.text(editValues.nome || '', 100);
      validateInput.codigoAcesso(editValues.codigo_acesso || '');
      validateInput.text(editValues.loja || '', 50);
    } catch (error: any) {
      toast.error(`Erro de validação: ${error.message}`);
      return;
    }

    onUpdate(usuario.id, editValues);
    setEditingUser(null);
  };

  const isEditing = editingUser === usuario.id;

  // Determinar quais lojas mostrar baseado no tipo
  const getAvailableLojas = () => {
    if (editValues.tipo === 'cd') {
      // Usuários CD só podem ser vinculados à loja que é CD
      return cdLoja ? [cdLoja] : [];
    }
    // Outros tipos podem ser vinculados a qualquer loja (exceto CD)
    return lojas.filter(loja => !loja.is_cd);
  };

  // Auto-selecionar loja CD quando tipo for CD
  const handleTipoChange = (newTipo: string) => {
    const updates = { ...editValues, tipo: newTipo };
    
    if (newTipo === 'cd' && cdLoja) {
      updates.loja = cdLoja.nome;
    } else if (newTipo !== 'cd' && editValues.loja === cdLoja?.nome) {
      // Se estava como CD e mudou, resetar para primeira loja disponível
      const availableLojas = lojas.filter(loja => !loja.is_cd);
      updates.loja = availableLojas[0]?.nome || 'Home';
    }
    
    setEditValues(updates);
  };

  const getTipoBadgeColor = (tipo: string) => {
    switch (tipo) {
      case 'master': return 'bg-purple-600';
      case 'comprador': return 'bg-blue-600';
      case 'estoque': return 'bg-green-600';
      case 'cd': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const availableLojas = getAvailableLojas();

  const isNewUser = !usuario.aprovado;

  return (
    <Card className={`mb-3 ${isNewUser ? 'border-orange-200 bg-orange-50' : ''}`}>
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
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-lg text-gray-900">{usuario.nome}</h3>
                    {isNewUser && (
                      <Badge className="bg-orange-500 text-white text-xs">PENDENTE</Badge>
                    )}
                    {usuario.tipo === 'cd' && (
                      <Truck className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
              )}
            </div>

            {/* Tipo e Loja */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-32">
                <label className="text-xs text-gray-500 block mb-1">Tipo</label>
                {isEditing ? (
                  <Select
                    value={editValues.tipo}
                    onValueChange={handleTipoChange}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprador">Comprador</SelectItem>
                      <SelectItem value="estoque">Estoque</SelectItem>
                      <SelectItem value="master">Master</SelectItem>
                      <SelectItem value="cd">Centro de Distribuição</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={`text-white ${getTipoBadgeColor(usuario.tipo)}`}>
                    {usuario.tipo === 'cd' ? 'Centro de Distribuição' : usuario.tipo}
                  </Badge>
                )}
              </div>

              <div className="flex-1 min-w-32">
                <label className="text-xs text-gray-500 block mb-1">Loja</label>
                {isEditing ? (
                  <Select
                    value={editValues.loja}
                    onValueChange={(value) => setEditValues(prev => ({ ...prev, loja: value }))}
                    disabled={editValues.tipo === 'cd' && availableLojas.length <= 1}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLojas.map(loja => (
                        <SelectItem key={loja.id} value={loja.nome}>
                          {loja.nome} {loja.is_cd ? '(CD)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={`${usuario.tipo === 'cd' ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                    {usuario.loja} {usuario.tipo === 'cd' ? '(CD)' : ''}
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
                {isNewUser && (
                  <Button size="sm" onClick={() => onApprove(usuario.id)} className="bg-green-600 hover:bg-green-700 h-8">
                    Aprovar
                  </Button>
                )}
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
