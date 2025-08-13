import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface NovoFornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFornecedorCriado: (fornecedor: { id: string; nome: string; telefone?: string; status_tipo?: string }) => void;
}

const NovoFornecedorModal: React.FC<NovoFornecedorModalProps> = ({
  isOpen,
  onClose,
  onFornecedorCriado,
}) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [statusTipo, setStatusTipo] = useState('Pedido Simples');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast.error('Nome do fornecedor é obrigatório');
      return;
    }

    setLoading(true);

    try {
      // Verificar se já existe fornecedor com nome similar
      const { data: fornecedoresExistentes } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .ilike('nome', nome.trim());

      if (fornecedoresExistentes && fornecedoresExistentes.length > 0) {
        toast.error(`Já existe um fornecedor com nome similar: "${fornecedoresExistentes[0].nome}"`);
        setLoading(false);
        return;
      }

      // Criar novo fornecedor
      const { data: novoFornecedor, error } = await supabase
        .from('fornecedores')
        .insert({
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          status_tipo: statusTipo
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Fornecedor "${nome}" cadastrado com sucesso!`);
      
      // Notificar componente pai
      onFornecedorCriado(novoFornecedor);
      
      // Limpar formulário e fechar modal
      setNome('');
      setTelefone('');
      setStatusTipo('Pedido Simples');
      onClose();
      
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      toast.error(error.message || 'Erro ao criar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNome('');
    setTelefone('');
    setStatusTipo('Pedido Simples');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Fornecedor</DialogTitle>
          <DialogDescription>
            Preencha os dados do fornecedor para cadastrá-lo rapidamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Fornecedor *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome do fornecedor"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusTipo">Tipo de Fornecedor</Label>
            <Select value={statusTipo} onValueChange={setStatusTipo} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pedido Simples">Pedido Simples</SelectItem>
                <SelectItem value="Cotação">Cotação</SelectItem>
                <SelectItem value="Cotação e Pedido">Cotação e Pedido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex items-center space-x-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovoFornecedorModal;