import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertTriangle, Package, Scale } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Transferencia {
  id: string;
  produto_id: string;
  produto_nome: string;
  loja_origem: string;
  quantidade_transferida: number;
  criado_em: string;
  produtos?: {
    produto: string;
    unidade: string;
    media_por_caixa: number;
  };
}

const ConfirmacaoTab = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [quantidadesRecebidas, setQuantidadesRecebidas] = useState<Record<string, number>>({});
  const [modalConfirmacao, setModalConfirmacao] = useState<{ aberto: boolean; transferencias?: Transferencia[] }>({ aberto: false });

  // Buscar transferências pendentes de confirmação
  const { data: transferenciasPendentes, isLoading } = useQuery({
    queryKey: ['transferencias-confirmacao', profile?.loja],
    queryFn: async () => {
      if (!profile?.loja) return [];
      
      console.log('Buscando transferências para confirmação na loja:', profile.loja);
      
      const { data, error } = await supabase
        .from('transferencias')
        .select(`
          *,
          produtos(produto, unidade, media_por_caixa)
        `)
        .eq('loja_destino', profile.loja)
        .eq('status', 'separado')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transferências:', error);
        throw error;
      }

      console.log('Transferências encontradas:', data);

      // Processar dados
      const transferenciasProcessadas = data?.map(t => ({
        id: t.id,
        produto_id: t.produto_id,
        produto_nome: (t.produtos as any)?.produto || 'Produto não encontrado',
        loja_origem: t.loja_origem,
        quantidade_transferida: t.quantidade_transferida || 0,
        criado_em: t.criado_em,
        produtos: t.produtos as any
      })) || [];

      return transferenciasProcessadas;
    },
    enabled: !!profile?.loja,
  });

  // Mutation para confirmar recebimento
  const confirmarRecebimentoMutation = useMutation({
    mutationFn: async ({ transferencias, comDivergencia }: { 
      transferencias: Transferencia[]; 
      comDivergencia: boolean;
    }) => {
      console.log('Confirmando recebimento das transferências:', transferencias);

      for (const transferencia of transferencias) {
        const quantidadeRecebida = quantidadesRecebidas[transferencia.id] ?? transferencia.quantidade_transferida;
        
        // Atualizar status da transferência
        const { error: updateError } = await supabase
          .from('transferencias')
          .update({
            status: 'recebido',
            confirmado_em: new Date().toISOString(),
            confirmado_por: profile?.id
          })
          .eq('id', transferencia.id);

        if (updateError) {
          console.error('Erro ao confirmar transferência:', updateError);
          throw updateError;
        }

        // Atualizar estoque da loja (converter kg para caixas se necessário)
        const mediaPorCaixa = transferencia.produtos?.media_por_caixa || 20;
        const quantidadeCaixas = Math.round(quantidadeRecebida / mediaPorCaixa * 100) / 100; // Arredonda para 2 casas decimais

        // Verificar se já existe registro de estoque
        const { data: estoqueExistente, error: fetchError } = await supabase
          .from('estoque_atual')
          .select('quantidade')
          .eq('produto_id', transferencia.produto_id)
          .eq('loja', profile?.loja)
          .maybeSingle();

        if (fetchError) {
          console.error('Erro ao buscar estoque existente:', fetchError);
          throw fetchError;
        }

        if (estoqueExistente) {
          // Atualizar estoque existente
          const novaQuantidade = (estoqueExistente.quantidade || 0) + quantidadeCaixas;
          
          const { error: estoqueError } = await supabase
            .from('estoque_atual')
            .update({
              quantidade: novaQuantidade,
              atualizado_em: new Date().toISOString()
            })
            .eq('produto_id', transferencia.produto_id)
            .eq('loja', profile?.loja);

          if (estoqueError) {
            console.error('Erro ao atualizar estoque:', estoqueError);
            throw estoqueError;
          }
        } else {
          // Criar novo registro de estoque
          const { error: estoqueError } = await supabase
            .from('estoque_atual')
            .insert({
              produto_id: transferencia.produto_id,
              loja: profile?.loja,
              quantidade: quantidadeCaixas,
              atualizado_em: new Date().toISOString()
            });

          if (estoqueError) {
            console.error('Erro ao criar estoque:', estoqueError);
            throw estoqueError;
          }
        }

        // Registrar divergência se houver
        if (comDivergencia && quantidadeRecebida !== transferencia.quantidade_transferida) {
          const { error: divergenciaError } = await supabase
            .from('divergencias_transferencias')
            .insert({
              transferencia_id: transferencia.id,
              tipo_divergencia: 'quantidade',
              descricao: `Divergência na quantidade recebida: esperado ${transferencia.quantidade_transferida}kg, recebido ${quantidadeRecebida}kg`,
              quantidade_esperada: transferencia.quantidade_transferida,
              quantidade_real: quantidadeRecebida
            });

          if (divergenciaError) {
            console.error('Erro ao registrar divergência:', divergenciaError);
            // Não bloqueia o processo, apenas loga o erro
          }
        }
      }

      console.log('Recebimento confirmado com sucesso');
    },
    onSuccess: (_, { comDivergencia }) => {
      const mensagem = comDivergencia 
        ? 'Recebimento confirmado com divergências registradas!' 
        : 'Recebimento confirmado com sucesso!';
      toast.success(mensagem);
      
      queryClient.invalidateQueries({ queryKey: ['transferencias-confirmacao'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-atual'] });
      setModalConfirmacao({ aberto: false });
      setQuantidadesRecebidas({});
    },
    onError: (error: any) => {
      console.error('Erro ao confirmar recebimento:', error);
      toast.error('Erro ao confirmar recebimento: ' + error.message);
    },
  });

  const handleQuantidadeChange = (transferenceId: string, quantidade: number) => {
    setQuantidadesRecebidas(prev => ({
      ...prev,
      [transferenceId]: quantidade
    }));
  };

  const abrirModalConfirmacao = () => {
    if (!transferenciasPendentes || transferenciasPendentes.length === 0) {
      toast.error('Nenhuma transferência para confirmar');
      return;
    }
    setModalConfirmacao({ aberto: true, transferencias: transferenciasPendentes });
  };

  const confirmarTudo = () => {
    if (!modalConfirmacao.transferencias) return;

    // Verificar se há divergências
    const temDivergencia = modalConfirmacao.transferencias.some(t => {
      const quantidadeRecebida = quantidadesRecebidas[t.id] ?? t.quantidade_transferida;
      return quantidadeRecebida !== t.quantidade_transferida;
    });

    confirmarRecebimentoMutation.mutate({
      transferencias: modalConfirmacao.transferencias,
      comDivergencia: temDivergencia
    });
  };

  const confirmarSemDivergencia = () => {
    if (!modalConfirmacao.transferencias) return;

    // Resetar quantidades para os valores transferidos
    const novasQuantidades: Record<string, number> = {};
    modalConfirmacao.transferencias.forEach(t => {
      novasQuantidades[t.id] = t.quantidade_transferida;
    });
    setQuantidadesRecebidas(novasQuantidades);

    confirmarRecebimentoMutation.mutate({
      transferencias: modalConfirmacao.transferencias,
      comDivergencia: false
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando transferências...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Confirmação de Recebimento
              </CardTitle>
              {transferenciasPendentes && transferenciasPendentes.length > 0 && (
                <Button
                  onClick={abrirModalConfirmacao}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={confirmarRecebimentoMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Tudo
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Loja: <Badge variant="outline">{profile?.loja}</Badge>
            </p>
          </CardHeader>
          <CardContent>
            {!transferenciasPendentes || transferenciasPendentes.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">Nenhuma transferência para confirmar</p>
                <p className="text-gray-400 text-sm">
                  Quando o CD separar produtos para sua loja, eles aparecerão aqui para confirmação.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Confira os produtos recebidos e ajuste as quantidades se necessário:
                </p>
                
                {isMobile ? (
                  <div className="space-y-4">
                    {transferenciasPendentes.map((transferencia) => (
                      <Card key={transferencia.id} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-gray-900">
                                {transferencia.produto_nome}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {transferencia.loja_origem}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-500 block">Transferido</span>
                                <div className="flex items-center font-medium">
                                  <Scale className="h-3 w-3 mr-1" />
                                  {transferencia.quantidade_transferida} kg
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 block">Data</span>
                                <div className="text-xs">
                                  {new Date(transferencia.criado_em).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-500 text-sm block mb-1">Quantidade Recebida (kg)</span>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={quantidadesRecebidas[transferencia.id] ?? transferencia.quantidade_transferida}
                                onChange={(e) => handleQuantidadeChange(transferencia.id, parseFloat(e.target.value) || 0)}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Transferido (kg)</TableHead>
                        <TableHead>Recebido (kg)</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferenciasPendentes.map((transferencia) => {
                        const quantidadeRecebida = quantidadesRecebidas[transferencia.id] ?? transferencia.quantidade_transferida;
                        const temDivergencia = quantidadeRecebida !== transferencia.quantidade_transferida;
                        
                        return (
                          <TableRow key={transferencia.id}>
                            <TableCell className="font-medium">
                              {transferencia.produto_nome}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transferencia.loja_origem}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Scale className="h-4 w-4 mr-1" />
                                {transferencia.quantidade_transferida}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={quantidadeRecebida}
                                  onChange={(e) => handleQuantidadeChange(transferencia.id, parseFloat(e.target.value) || 0)}
                                  className="w-24"
                                />
                                {temDivergencia && (
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {new Date(transferencia.criado_em).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">Aguardando</Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Confirmação */}
        <Dialog open={modalConfirmacao.aberto} onOpenChange={(open) => setModalConfirmacao({ aberto: open })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Recebimento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja confirmar o recebimento de todos os produtos?
                {modalConfirmacao.transferencias?.some(t => {
                  const quantidadeRecebida = quantidadesRecebidas[t.id] ?? t.quantidade_transferida;
                  return quantidadeRecebida !== t.quantidade_transferida;
                }) && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mr-2" />
                      <span className="text-sm text-orange-700">
                        Detectadas divergências nas quantidades
                      </span>
                    </div>
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setModalConfirmacao({ aberto: false })}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={confirmarSemDivergencia}
                disabled={confirmarRecebimentoMutation.isPending}
                className="w-full sm:w-auto"
              >
                Confirmar Sem Divergência
              </Button>
              <Button
                onClick={confirmarTudo}
                disabled={confirmarRecebimentoMutation.isPending}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {confirmarRecebimentoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ConfirmacaoTab;