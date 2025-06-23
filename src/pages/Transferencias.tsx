import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Package, CheckCircle, AlertTriangle, Truck, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Transferencias = () => {
  const { hasRole, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});

  // Buscar requisições pendentes com produtos (para usuários de transferência)
  const { data: requisicoesPendentes, isLoading: isLoadingRequisicoes } = useQuery({
    queryKey: ['requisicoes-transferencia'],
    queryFn: async () => {
      console.log('Buscando requisições para transferência...');
      
      const { data: requisicoes, error } = await supabase
        .from('requisicoes')
        .select(`
          *,
          itens_requisicao (
            *,
            produtos (*)
          )
        `)
        .neq('loja', 'Home')
        .eq('status', 'pendente')
        .order('data_requisicao', { ascending: false });

      if (error) {
        console.error('Erro ao buscar requisições:', error);
        throw error;
      }

      console.log('Requisições encontradas:', requisicoes);
      return requisicoes || [];
    },
    enabled: hasRole('transferencia'),
  });

  // Buscar transferências pendentes de confirmação (para usuários das lojas)
  const { data: transferenciasPendentes, isLoading: isLoadingTransferencias } = useQuery({
    queryKey: ['transferencias-pendentes', profile?.loja],
    queryFn: async () => {
      console.log('Buscando transferências pendentes para loja:', profile?.loja);
      
      const { data, error } = await supabase
        .from('transferencias')
        .select(`
          *,
          produtos (nome_base, nome_variacao),
          requisicoes (loja)
        `)
        .eq('loja_destino', profile?.loja)
        .eq('status', 'transferido')
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('Erro ao buscar transferências pendentes:', error);
        throw error;
      }

      console.log('Transferências pendentes encontradas:', data);
      return data || [];
    },
    enabled: !hasRole('transferencia') && !!profile?.loja && profile.loja !== 'Home',
  });

  // Buscar estoque atual de todas as lojas
  const { data: estoqueLojas } = useQuery({
    queryKey: ['estoque-todas-lojas'],
    queryFn: async () => {
      console.log('Buscando estoque de todas as lojas...');
      
      const { data, error } = await supabase
        .from('estoque_atual')
        .select(`
          *,
          produtos (nome_base, nome_variacao)
        `);

      if (error) {
        console.error('Erro ao buscar estoque:', error);
        throw error;
      }

      const estoqueOrganizado: Record<string, Record<string, number>> = {};
      data?.forEach(item => {
        if (!estoqueOrganizado[item.produto_id]) {
          estoqueOrganizado[item.produto_id] = {};
        }
        estoqueOrganizado[item.produto_id][item.loja] = item.quantidade || 0;
      });

      console.log('Estoque organizado:', estoqueOrganizado);
      return estoqueOrganizado;
    },
    enabled: hasRole('transferencia'),
  });

  // Mutation para processar transferência
  const processTransferMutation = useMutation({
    mutationFn: async ({ 
      requisicaoId, 
      produtoId, 
      lojaDestino, 
      quantidadeRequisitada, 
      quantidadeTransferida 
    }: {
      requisicaoId: string;
      produtoId: string;
      lojaDestino: string;
      quantidadeRequisitada: number;
      quantidadeTransferida: number;
    }) => {
      console.log('Processando transferência:', {
        requisicaoId,
        produtoId,
        lojaDestino,
        quantidadeRequisitada,
        quantidadeTransferida
      });

      // Criar registro de transferência
      const { error: transferError } = await supabase
        .from('transferencias')
        .insert({
          requisicao_id: requisicaoId,
          produto_id: produtoId,
          loja_destino: lojaDestino,
          quantidade_requisitada: quantidadeRequisitada,
          quantidade_transferida: quantidadeTransferida,
          status: 'transferido',
          transferido_por: profile?.id
        });

      if (transferError) {
        console.error('Erro ao criar transferência:', transferError);
        throw transferError;
      }

      // Descontar do estoque da Home
      const { error: estoqueError } = await supabase
        .from('estoque_atual')
        .update({
          quantidade: estoqueLojas?.[produtoId]?.['Home'] - quantidadeTransferida,
          atualizado_em: new Date().toISOString()
        })
        .eq('produto_id', produtoId)
        .eq('loja', 'Home');

      if (estoqueError) {
        console.error('Erro ao atualizar estoque:', estoqueError);
        throw estoqueError;
      }

      console.log('Transferência processada com sucesso');
    },
    onSuccess: () => {
      toast.success('Transferência processada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['requisicoes-transferencia'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-todas-lojas'] });
    },
    onError: (error: any) => {
      console.error('Erro ao processar transferência:', error);
      toast.error('Erro ao processar transferência: ' + error.message);
    },
  });

  // Mutation para confirmar recebimento
  const confirmarRecebimentoMutation = useMutation({
    mutationFn: async ({ transferenceId }: { transferenceId: string }) => {
      console.log('Confirmando recebimento da transferência:', transferenceId);

      // Buscar dados da transferência
      const { data: transferencia, error: fetchError } = await supabase
        .from('transferencias')
        .select('*')
        .eq('id', transferenceId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar transferência:', fetchError);
        throw fetchError;
      }

      // Atualizar status da transferência
      const { error: updateError } = await supabase
        .from('transferencias')
        .update({
          status: 'confirmado',
          confirmado_em: new Date().toISOString(),
          confirmado_por: profile?.id
        })
        .eq('id', transferenceId);

      if (updateError) {
        console.error('Erro ao confirmar transferência:', updateError);
        throw updateError;
      }

      // Atualizar estoque da loja de destino
      const estoqueAtual = estoqueLojas?.[transferencia.produto_id]?.[transferencia.loja_destino] || 0;
      const novaQuantidade = estoqueAtual + (transferencia.quantidade_transferida || 0);

      // Verificar se já existe registro de estoque para este produto na loja
      const { data: estoqueExistente } = await supabase
        .from('estoque_atual')
        .select('id')
        .eq('produto_id', transferencia.produto_id)
        .eq('loja', transferencia.loja_destino)
        .maybeSingle();

      if (estoqueExistente) {
        // Atualizar estoque existente
        const { error: estoqueError } = await supabase
          .from('estoque_atual')
          .update({
            quantidade: novaQuantidade,
            atualizado_em: new Date().toISOString()
          })
          .eq('produto_id', transferencia.produto_id)
          .eq('loja', transferencia.loja_destino);

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
            loja: transferencia.loja_destino,
            quantidade: transferencia.quantidade_transferida || 0,
            atualizado_em: new Date().toISOString()
          });

        if (estoqueError) {
          console.error('Erro ao criar estoque:', estoqueError);
          throw estoqueError;
        }
      }

      console.log('Recebimento confirmado com sucesso');
    },
    onSuccess: () => {
      toast.success('Recebimento confirmado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['transferencias-pendentes'] });
      queryClient.invalidateQueries({ queryKey: ['estoque-todas-lojas'] });
    },
    onError: (error: any) => {
      console.error('Erro ao confirmar recebimento:', error);
      toast.error('Erro ao confirmar recebimento: ' + error.message);
    },
  });

  const handleQuantityChange = (key: string, value: number) => {
    setTransferQuantities(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTransfer = (
    requisicaoId: string,
    produtoId: string,
    lojaDestino: string,
    quantidadeRequisitada: number
  ) => {
    const key = `${requisicaoId}-${produtoId}`;
    const quantidadeTransferida = transferQuantities[key] || quantidadeRequisitada;
    
    if (quantidadeTransferida <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }

    const estoqueHome = estoqueLojas?.[produtoId]?.['Home'] || 0;
    if (quantidadeTransferida > estoqueHome) {
      toast.error('Quantidade solicitada maior que estoque disponível');
      return;
    }

    processTransferMutation.mutate({
      requisicaoId,
      produtoId,
      lojaDestino,
      quantidadeRequisitada,
      quantidadeTransferida
    });
  };

  const handleConfirmarRecebimento = (transferenceId: string) => {
    confirmarRecebimentoMutation.mutate({ transferenceId });
  };

  // Verificar se o usuário tem permissão para acessar a página
  if (!hasRole('transferencia') && !hasRole('requisitante') && !hasRole('master') && !profile?.loja) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">Apenas usuários de transferência ou lojas podem acessar esta página.</p>
            <Button onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingRequisicoes || isLoadingTransferencias) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Package className="h-8 w-8 text-yellow-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Transferências</h1>
                <p className="text-sm text-gray-500">
                  {hasRole('transferencia') 
                    ? 'Gerenciar transferências entre lojas' 
                    : 'Confirmar recebimento de transferências'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasRole('transferencia') ? (
          <Card>
            <CardHeader>
              <CardTitle>Requisições Pendentes de Transferência</CardTitle>
            </CardHeader>
            <CardContent>
              {requisicoesPendentes?.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma requisição pendente para transferência
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loja Destino</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Qtd. Requisitada</TableHead>
                      <TableHead>Estoque Home</TableHead>
                      <TableHead>Estoque Destino</TableHead>
                      <TableHead>Qtd. a Transferir</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requisicoesPendentes?.map((requisicao) =>
                      requisicao.itens_requisicao?.map((item: any) => {
                        const key = `${requisicao.id}-${item.produto_id}`;
                        const estoqueHome = estoqueLojas?.[item.produto_id]?.['Home'] || 0;
                        const estoqueDestino = estoqueLojas?.[item.produto_id]?.[requisicao.loja] || 0;
                        const produtoNome = item.produtos?.nome_variacao || item.produtos?.nome_base || 'Produto';
                        
                        return (
                          <TableRow key={key}>
                            <TableCell>
                              <Badge variant="outline">{requisicao.loja}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{produtoNome}</TableCell>
                            <TableCell>{item.quantidade}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <span>{estoqueHome}</span>
                                {estoqueHome < item.quantidade && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{estoqueDestino}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                max={estoqueHome}
                                defaultValue={item.quantidade}
                                onChange={(e) => handleQuantityChange(key, parseFloat(e.target.value) || 0)}
                                className="w-20"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => handleTransfer(
                                  requisicao.id,
                                  item.produto_id,
                                  requisicao.loja,
                                  item.quantidade
                                )}
                                disabled={processTransferMutation.isPending || estoqueHome <= 0}
                              >
                                {processTransferMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Truck className="h-4 w-4" />
                                )}
                                Transferir
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Transferências Pendentes de Confirmação
              </CardTitle>
              <p className="text-sm text-gray-600">
                Loja: <Badge variant="outline">{profile?.loja}</Badge>
              </p>
            </CardHeader>
            <CardContent>
              {transferenciasPendentes?.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma transferência pendente de confirmação
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade Transferida</TableHead>
                      <TableHead>Data da Transferência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferenciasPendentes?.map((transferencia) => {
                      const produtoNome = transferencia.produtos?.nome_variacao || 
                                         transferencia.produtos?.nome_base || 'Produto';
                      
                      return (
                        <TableRow key={transferencia.id}>
                          <TableCell className="font-medium">{produtoNome}</TableCell>
                          <TableCell>{transferencia.quantidade_transferida}</TableCell>
                          <TableCell>
                            {new Date(transferencia.criado_em).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <Truck className="h-3 w-3 mr-1" />
                              Em trânsito
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleConfirmarRecebimento(transferencia.id)}
                              disabled={confirmarRecebimentoMutation.isPending}
                            >
                              {confirmarRecebimentoMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              Confirmar Recebimento
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Transferencias;
