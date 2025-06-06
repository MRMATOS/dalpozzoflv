
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Transferencias = () => {
  const { hasRole, profile } = useAuth();
  const queryClient = useQueryClient();
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({});

  // Buscar requisições pendentes com produtos
  const { data: requisicoesPendentes, isLoading } = useQuery({
    queryKey: ['requisicoes-transferencia'],
    queryFn: async () => {
      console.log('Buscando requisições para transferência...');
      
      // Buscar requisições de lojas diferentes de Home
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

      // Organizar por produto e loja
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

  if (!hasRole('transferencia')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Apenas usuários de transferência podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
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
                <p className="text-sm text-gray-500">Gerenciar transferências entre lojas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                <CheckCircle className="h-4 w-4" />
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
      </main>
    </div>
  );
};

export default Transferencias;
