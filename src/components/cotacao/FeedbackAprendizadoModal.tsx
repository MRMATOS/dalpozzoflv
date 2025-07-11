import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { AprendizadoService } from '@/services/cotacao/aprendizadoService';
import { useToast } from '@/hooks/use-toast';
import { Star, ThumbsUp, ThumbsDown, Brain, Target } from 'lucide-react';

interface FeedbackAprendizadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: ProdutoExtraido | null;
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
  const [avaliacao, setAvaliacao] = useState<number>(0);
  const [aprovado, setAprovado] = useState<boolean | null>(null);
  const [comentarios, setComentarios] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  const { toast } = useToast();

  const handleEnviarFeedback = async () => {
    if (!produto || avaliacao === 0 || aprovado === null) {
      toast({
        title: "Campos obrigatórios",
        description: "Avalie a extração e marque se foi correta.",
        variant: "destructive"
      });
      return;
    }

    setEnviando(true);
    
    try {
      const sucesso = await AprendizadoService.registrarFeedback(
        produto,
        textoOriginal,
        {
          qualidade: avaliacao,
          aprovado: aprovado
        }
      );

      if (sucesso) {
        toast({
          title: "Feedback registrado!",
          description: "Obrigado! Seu feedback ajudará a melhorar o sistema.",
        });
        onFeedbackEnviado();
        handleReset();
        onClose();
      } else {
        throw new Error('Erro ao registrar feedback');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar o feedback.",
        variant: "destructive"
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleReset = () => {
    setAvaliacao(0);
    setAprovado(null);
    setComentarios('');
  };

  const renderEstrelas = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        onClick={() => setAvaliacao(i + 1)}
        className={`text-2xl transition-colors ${
          i < avaliacao ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
        }`}
      >
        <Star className={`w-6 h-6 ${i < avaliacao ? 'fill-current' : ''}`} />
      </button>
    ));
  };

  const getAvaliacaoTexto = () => {
    switch (avaliacao) {
      case 1: return 'Muito ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return 'Não avaliado';
    }
  };

  if (!produto) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Feedback de Aprendizado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Produto Extraído */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-2">Produto extraído:</div>
            <div className="font-medium">{produto.produto}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{produto.tipo}</Badge>
              {produto.preco !== null && (
                <Badge variant="secondary">R$ {produto.preco.toFixed(2)}</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Fornecedor: {produto.fornecedor}
            </div>
          </div>

          {/* Avaliação da Qualidade */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              Avalie a qualidade da extração:
            </label>
            <div className="flex items-center gap-1 mb-2">
              {renderEstrelas()}
            </div>
            <div className="text-sm text-muted-foreground">
              {getAvaliacaoTexto()}
            </div>
          </div>

          {/* Aprovação */}
          <div>
            <label className="text-sm font-medium mb-3 block">
              A extração foi correta?
            </label>
            <div className="flex gap-3">
              <Button
                variant={aprovado === true ? "default" : "outline"}
                onClick={() => setAprovado(true)}
                className="flex items-center gap-2 flex-1"
              >
                <ThumbsUp className="w-4 h-4" />
                Sim, correta
              </Button>
              <Button
                variant={aprovado === false ? "destructive" : "outline"}
                onClick={() => setAprovado(false)}
                className="flex items-center gap-2 flex-1"
              >
                <ThumbsDown className="w-4 h-4" />
                Não, incorreta
              </Button>
            </div>
          </div>

          {/* Comentários opcionais */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Comentários (opcional):
            </label>
            <Textarea
              placeholder="Observações sobre a extração..."
              value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarFeedback} 
              disabled={enviando || avaliacao === 0 || aprovado === null}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              {enviando ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>

          {/* Nota sobre aprendizado */}
          <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded border border-blue-200">
            💡 Seu feedback ajuda o sistema a aprender e melhorar automaticamente as próximas extrações para este fornecedor.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackAprendizadoModal;