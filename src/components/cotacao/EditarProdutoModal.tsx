import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3 } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { useToast } from '@/hooks/use-toast';

interface EditarProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: ProdutoExtraido | null;
  onSalvar: (produtoEditado: ProdutoExtraido) => void;
  onDeletar: (produto: ProdutoExtraido) => void;
}

const EditarProdutoModal: React.FC<EditarProdutoModalProps> = ({
  isOpen,
  onClose,
  produto,
  onSalvar,
  onDeletar
}) => {
  const [nomeProduto, setNomeProduto] = useState('');
  const [tipoProduto, setTipoProduto] = useState('');
  const [precoProduto, setPrecoProduto] = useState('');
  const [unidadeProduto, setUnidadeProduto] = useState('');
  const [confiancaProduto, setConfiancaProduto] = useState(0);
  
  const { toast } = useToast();

  const unidadesDisponiveis = ['Caixa', 'Kg', 'Maço', 'Bandeja', 'Unidade', 'Dúzia'];

  useEffect(() => {
    if (produto) {
      setNomeProduto(produto.produto);
      setTipoProduto(produto.tipo);
      setPrecoProduto(produto.preco?.toString() || '');
      setUnidadeProduto(produto.unidade || 'Caixa');
      setConfiancaProduto(produto.confianca || 0);
    }
  }, [produto]);

  const handleSalvar = () => {
    if (!produto || !nomeProduto.trim() || !tipoProduto.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome do produto e tipo são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    let precoNumerico: number | null = null;
    if (precoProduto.trim()) {
      precoNumerico = parseFloat(precoProduto.replace(',', '.'));
      if (isNaN(precoNumerico)) {
        toast({
          title: "Preço inválido",
          description: "Informe um preço válido ou deixe em branco.",
          variant: "destructive"
        });
        return;
      }
    }

    const produtoEditado: ProdutoExtraido = {
      ...produto,
      produto: nomeProduto.trim(),
      tipo: tipoProduto.trim(),
      preco: precoNumerico,
      unidade: unidadeProduto,
      confianca: confiancaProduto
    };

    onSalvar(produtoEditado);
    
    toast({
      title: "Produto atualizado",
      description: `${nomeProduto} foi atualizado com sucesso.`
    });

    onClose();
  };

  const handleDeletar = () => {
    if (!produto) return;

    if (window.confirm(`Tem certeza que deseja remover "${produto.produto} - ${produto.tipo}" da cotação?`)) {
      onDeletar(produto);
      
      toast({
        title: "Produto removido",
        description: `${produto.produto} foi removido da cotação.`
      });

      onClose();
    }
  };

  const getCorConfianca = (confianca: number) => {
    if (confianca >= 0.8) return 'text-green-600 bg-green-100';
    if (confianca >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (!produto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Editar Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <div>
              <div className="text-sm text-muted-foreground">Fornecedor</div>
              <div className="font-medium">{produto.fornecedor}</div>
            </div>
            <Badge className={`${getCorConfianca(confiancaProduto)} border-0`}>
              {Math.round(confiancaProduto * 100)}% confiança
            </Badge>
          </div>

          <div>
            <Label htmlFor="nome-produto">Nome do Produto *</Label>
            <Input
              id="nome-produto"
              value={nomeProduto}
              onChange={(e) => setNomeProduto(e.target.value)}
              placeholder="Nome do produto"
            />
          </div>

          <div>
            <Label htmlFor="tipo-produto">Tipo/Variação *</Label>
            <Input
              id="tipo-produto"
              value={tipoProduto}
              onChange={(e) => setTipoProduto(e.target.value)}
              placeholder="Tipo ou variação"
            />
          </div>

          <div>
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input
              id="preco"
              value={precoProduto}
              onChange={(e) => setPrecoProduto(e.target.value)}
              placeholder="Ex: 15,50 (deixe vazio se não informado)"
            />
          </div>

          <div>
            <Label htmlFor="unidade">Unidade</Label>
            <Select value={unidadeProduto} onValueChange={setUnidadeProduto}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unidadesDisponiveis.map((unidade) => (
                  <SelectItem key={unidade} value={unidade}>
                    {unidade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="destructive"
              onClick={handleDeletar}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remover
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditarProdutoModal;