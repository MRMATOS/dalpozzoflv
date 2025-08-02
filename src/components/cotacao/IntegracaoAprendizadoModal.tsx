import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Brain, Database } from 'lucide-react';
import { ProdutoExtraido } from '@/utils/productExtraction/types';
import { salvarAprendizadoExtração } from '@/services/cotacao/databaseIntegration';
import { useToast } from '@/hooks/use-toast';

interface IntegracaoAprendizadoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produtosExtraidos: ProdutoExtraido[];
  fornecedor: string;
  produtos: Array<{
    id: string;
    produto: string;
    nome_variacao?: string;
  }>;
}

export function IntegracaoAprendizadoModal({
  open,
  onOpenChange,
  produtosExtraidos,
  fornecedor,
  produtos
}: IntegracaoAprendizadoModalProps) {
  const [produtosSelecionados, setProdutosSelecionados] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();

  const produtosSemIntegracao = produtosExtraidos.filter(p => !p.produtoId);

  const handleSelecaoProduto = (produtoIndex: number, produtoId: string) => {
    setProdutosSelecionados(prev => ({
      ...prev,
      [produtoIndex]: produtoId
    }));
  };

  const salvarAprendizados = async () => {
    setSalvando(true);
    let sucessos = 0;
    
    try {
      for (const [index, produtoId] of Object.entries(produtosSelecionados)) {
        const produto = produtosSemIntegracao[parseInt(index)];
        if (produto) {
          await salvarAprendizadoExtração(
            produto.produto,
            produtoId,
            fornecedor
          );
          sucessos++;
        }
      }

      toast({
        title: "Aprendizado salvo",
        description: `${sucessos} mapeamentos salvos com sucesso`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar os aprendizados",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Sistema de Aprendizado
          </DialogTitle>
          <DialogDescription>
            Configure os mapeamentos para melhorar a identificação automática de produtos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Integrados</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {produtosExtraidos.filter(p => p.produtoId).length}
              </p>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">
                {produtosSemIntegracao.length}
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Banco</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {produtos.length}
              </p>
            </div>
          </div>

          {produtosSemIntegracao.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Todos os produtos foram integrados!</h3>
              <p className="text-muted-foreground">
                Não há produtos pendentes para mapeamento
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4">
                Produtos para Mapeamento ({produtosSemIntegracao.length})
              </h3>
              
              <div className="space-y-4">
                {produtosSemIntegracao.map((produto, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{produto.produto}</h4>
                          {produto.tipo && (
                            <Badge variant="secondary">{produto.tipo}</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {Math.round((produto.confianca || 0) * 100)}% confiança
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {produto.linhaOriginal}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Selecionar produto do banco:
                      </label>
                      <Select
                        value={produtosSelecionados[index] || ''}
                        onValueChange={(value) => handleSelecaoProduto(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um produto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos
                            .filter(p => 
                              p.produto.toLowerCase().includes(produto.produto.toLowerCase()) ||
                              produto.produto.toLowerCase().includes(p.produto.toLowerCase())
                            )
                            .slice(0, 10)
                            .map((produtoBanco) => (
                              <SelectItem key={produtoBanco.id} value={produtoBanco.id}>
                                {produtoBanco.produto}
                                {produtoBanco.nome_variacao && (
                                  <span className="text-muted-foreground">
                                    {' - '}{produtoBanco.nome_variacao}
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {produtosSemIntegracao.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarAprendizados}
                disabled={Object.keys(produtosSelecionados).length === 0 || salvando}
              >
                {salvando ? 'Salvando...' : `Salvar ${Object.keys(produtosSelecionados).length} mapeamentos`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}