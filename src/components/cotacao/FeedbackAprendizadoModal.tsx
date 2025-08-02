import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { Check, X, AlertCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { AprendizadoService } from '@/services/cotacao/aprendizadoService';

interface FeedbackAprendizadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: ProdutoExtraido;
  textoOriginal: string;
  onFeedbackEnviado: () => void;
}

const FeedbackAprendizadoModal: React.FC<FeedbackAprendizadoModalProps> = ({
  isOpen,
  onClose,
  produto,
  textoOriginal,
  onFeedbackEnviado
}) => {
  const [produtoCorrigido, setProdutoCorrigido] = useState(produto.produto);
  const [tipoCorrigido, setTipoCorrigido] = useState(produto.tipo);
  const [precoCorrigido, setPrecoCorrigido] = useState(produto.preco?.toString() || '');
  const [qualidade, setQualidade] = useState([3]);
  const [aprovado, setAprovado] = useState<boolean | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async () => {
    if (aprovado === null) {
      toast.error('Por favor, indique se aprova ou rejeita a extração');
      return;
    }

    setEnviando(true);
    try {
      const feedback = {
        produto_corrigido: produtoCorrigido !== produto.produto ? produtoCorrigido : undefined,
        tipo_corrigido: tipoCorrigido !== produto.tipo ? tipoCorrigido : undefined,
        preco_corrigido: precoCorrigido !== produto.preco?.toString() ? parseFloat(precoCorrigido) || null : undefined,
        qualidade: qualidade[0],
        aprovado
      };

      const sucesso = await AprendizadoService.registrarFeedback(produto, textoOriginal, feedback);
      
      if (sucesso) {
        toast.success('Feedback registrado! O sistema vai melhorar com sua ajuda.');
        onFeedbackEnviado();
        onClose();
      } else {
        toast.error('Erro ao registrar feedback. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback');
    } finally {
      setEnviando(false);
    }
  };

  const getQualidadeLabel = (valor: number) => {
    const labels = {
      1: 'Muito Ruim',
      2: 'Ruim', 
      3: 'Regular',
      4: 'Bom',
      5: 'Excelente'
    };
    return labels[valor as keyof typeof labels];
  };

  const getConfiancaColor = (confianca?: number) => {
    if (!confianca) return 'secondary';
    if (confianca >= 0.8) return 'default';
    if (confianca >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Feedback de Extração
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Texto Original */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Texto Original do Fornecedor</Label>
            <div className="p-3 bg-gray-50 rounded-md border text-sm">
              {textoOriginal || 'Texto não disponível'}
            </div>
          </div>

          {/* Extração Atual vs Correção */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coluna Esquerda - Extraído */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Extraído pelo Sistema
              </h3>
              
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
                <div>
                  <Label className="text-xs text-gray-600">Produto</Label>
                  <div className="font-medium">{produto.produto}</div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Tipo</Label>
                  <div className="font-medium">{produto.tipo}</div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-600">Preço</Label>
                  <div className="font-medium">
                    {produto.preco ? `R$ ${produto.preco.toFixed(2)}` : 'Não informado'}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">Confiança</Label>
                  <Badge variant={getConfiancaColor(produto.confianca)} className="text-xs">
                    {produto.confianca ? `${(produto.confianca * 100).toFixed(0)}%` : 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Correção */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Correção (se necessário)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="produto-corrigido">Produto</Label>
                  <Input
                    id="produto-corrigido"
                    value={produtoCorrigido}
                    onChange={(e) => setProdutoCorrigido(e.target.value)}
                    placeholder="Nome correto do produto"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tipo-corrigido">Tipo</Label>
                  <Input
                    id="tipo-corrigido"
                    value={tipoCorrigido}
                    onChange={(e) => setTipoCorrigido(e.target.value)}
                    placeholder="Tipo correto do produto"
                  />
                </div>
                
                <div>
                  <Label htmlFor="preco-corrigido">Preço</Label>
                  <Input
                    id="preco-corrigido"
                    type="number"
                    step="0.01"
                    value={precoCorrigido}
                    onChange={(e) => setPrecoCorrigido(e.target.value)}
                    placeholder="Preço correto"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Avaliação de Qualidade */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Qualidade da Extração: {getQualidadeLabel(qualidade[0])}
            </Label>
            <div className="px-2">
              <Slider
                value={qualidade}
                onValueChange={setQualidade}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Muito Ruim</span>
                <span>Regular</span>
                <span>Excelente</span>
              </div>
            </div>
          </div>

          {/* Aprovação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Aprovação da Extração</Label>
            <div className="flex gap-3">
              <Button
                variant={aprovado === true ? 'default' : 'outline'}
                onClick={() => setAprovado(true)}
                className="flex-1 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant={aprovado === false ? 'destructive' : 'outline'}
                onClick={() => setAprovado(false)}
                className="flex-1 flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Rejeitar
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={enviando || aprovado === null}
              className="min-w-[120px]"
            >
              {enviando ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackAprendizadoModal;