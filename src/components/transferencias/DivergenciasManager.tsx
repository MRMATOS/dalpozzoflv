
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle, Clock, Scale } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DivergenciaTransferencia } from '@/types/transferencias';

const DivergenciasManager: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [resolverModal, setResolverModal] = useState<{ aberto: boolean; divergencia?: DivergenciaTransferencia }>({ aberto: false });
  const [observacaoResolucao, setObservacaoResolucao] = useState('');

  const { data: divergencias, isLoading } = useQuery({
    queryKey: ['divergencias-transferencias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('divergencias_transferencias')
        .select(`
          *,
          transferencias(
            loja_destino,
            produtos(produto)
          )
        `)
        .eq('resolvido', false)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      return data as DivergenciaTransferencia[];
    },
  });

  const resolverDivergenciaMutation = useMutation({
    mutationFn: async ({ divergenciaId, observacao }: { divergenciaId: string; observacao: string }) => {
      const { error } = await supabase
        .from('divergencias_transferencias')
        .update({
          resolvido: true,
          resolvido_por: profile?.id,
          resolvido_em: new Date().toISOString()
        })
        .eq('id', divergenciaId);

      if (error) throw error;

      // Registrar log da resolução
      const { error: logError } = await supabase
        .from('transferencias_logs')
        .insert({
          transferencia_id: resolverModal.divergencia?.transferencia_id,
          status_anterior: 'divergencia',
          status_novo: 'resolvido',
          usuario_id: profile?.id,
          observacoes: `Divergência resolvida: ${observacao}`
        });

      if (logError) throw logError;
    },
    onSuccess: () => {
      toast.success('Divergência resolvida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['divergencias-transferencias'] });
      setResolverModal({ aberto: false });
      setObservacaoResolucao('');
    },
    onError: (error: any) => {
      toast.error('Erro ao resolver divergência: ' + error.message);
    },
  });

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'quantidade':
        return <Scale className="h-4 w-4 text-orange-500" />;
      case 'prazo':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const handleResolverDivergencia = () => {
    if (!resolverModal.divergencia) return;
    
    resolverDivergenciaMutation.mutate({
      divergenciaId: resolverModal.divergencia.id,
      observacao: observacaoResolucao
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando divergências...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
          Divergências Detectadas
        </h3>
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
          {divergencias?.length || 0} pendentes
        </Badge>
      </div>

      {divergencias && divergencias.length > 0 ? (
        <div className="grid gap-4">
          {divergencias.map((divergencia) => (
            <Card key={divergencia.id} className="border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTipoIcon(divergencia.tipo_divergencia)}
                    <CardTitle className="text-base">
                      Divergência de {divergencia.tipo_divergencia}
                    </CardTitle>
                    <Badge variant="destructive" className="text-xs">
                      {divergencia.tipo_divergencia}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setResolverModal({ aberto: true, divergencia })}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolver
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">{divergencia.descricao}</p>
                
                {divergencia.quantidade_esperada !== null && divergencia.quantidade_real !== null && (
                  <div className="bg-orange-50 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Quantidade esperada:</span>
                      <span>{divergencia.quantidade_esperada}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Quantidade real:</span>
                      <span>{divergencia.quantidade_real}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-orange-700 mt-2 pt-2 border-t">
                      <span>Diferença:</span>
                      <span>{Math.abs((divergencia.quantidade_real || 0) - (divergencia.quantidade_esperada || 0))}</span>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Detectada em {new Date(divergencia.criado_em).toLocaleString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma divergência pendente encontrada.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Resolução */}
      <Dialog open={resolverModal.aberto} onOpenChange={(aberto) => setResolverModal({ aberto })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Divergência</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium mb-2">Descrição da divergência:</p>
              <p className="text-sm text-gray-700">{resolverModal.divergencia?.descricao}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Observações da resolução:
              </label>
              <Textarea
                value={observacaoResolucao}
                onChange={(e) => setObservacaoResolucao(e.target.value)}
                placeholder="Descreva como a divergência foi resolvida..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolverModal({ aberto: false })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResolverDivergencia}
              disabled={resolverDivergenciaMutation.isPending || !observacaoResolucao.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {resolverDivergenciaMutation.isPending ? 'Resolvendo...' : 'Marcar como Resolvida'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DivergenciasManager;
