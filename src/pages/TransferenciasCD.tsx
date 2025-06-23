import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Package, CheckCircle, AlertTriangle, Truck, ArrowLeft, Scale, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import HistoricoTransferencia from '@/components/transferencias/HistoricoTransferencia';

interface ProdutoRequisitado {
  produto_id: string;
  produto_nome: string;
  loja: string;
  quantidade_requisitada: number;
  quantidade_calculada: number;
  estoque_cd: number;
  quantidade_separar: number;
  confirmado: boolean;
  requisicao_id: string;
}

const TransferenciasCD = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [produtosSeparacao, setProdutosSeparacao] = useState<Record<string, ProdutoRequisitado>>({});
  const [modalConfirmacao, setModalConfirmacao] = useState<{ aberto: boolean; loja?: string }>({ aberto: false });
  const [historicoModal, setHistoricoModal] = useState<{ aberto: boolean; transferenceId?: string }>({ aberto: false });

  // Buscar a loja CD dinamicamente
  const { data: cdLoja } = useQuery({
    queryKey: ['cd-loja'],
    queryFn: async () => {
      console.log('Buscando loja CD...');
      
      const { data, error } = await supabase
        .from('lojas')
        .select('nome')
        .eq('is_cd', true)
        .eq('ativo', true)
        .single();

      if (error) {
        console.error('Erro ao buscar loja CD:', error);
        throw error;
      }

      console.log('Loja CD encontrada:', data?.nome);
      return data?.nome || 'CD';
    },
  });

  // Buscar todos os produtos requisitados agrupados
  const { data: produtosRequisitados, isLoading } = useQuery({
    queryKey: ['produtos-requisitados-cd', cdLoja],
    queryFn: async () => {
      if (!cdLoja) return {};
      
      console.log('Buscando produtos requisitados para CD...', cdLoja);
      
      const { data: requisicoes, error } = await supabase
        .from('requisicoes')
        .select(`
          id,
          loja,
          data_requisicao,
          itens_requisicao (
            produto_id,
            quantidade,
            quantidade_calculada,
            produtos (produto, unidade, media_por_caixa)
          )
        `)
        .eq('status', 'pendente')
        .neq('loja', cdLoja)
        .order('loja', { ascending: true });

      if (error) {
        console.error('Erro ao buscar requisições:', error);
        throw error;
      }

      // Buscar estoque do CD usando o nome correto da loja
      const { data: estoque, error: estoqueError } = await supabase
        .from('estoque_atual')
        .select('produto_id, quantidade')
        .eq('loja', cdLoja);

      if (estoqueError) {
        console.error('Erro ao buscar estoque CD:', estoqueError);
        throw estoqueError;
      }

      console.log('Estoque do CD encontrado:', estoque);

      const estoqueMap: Record<string, number> = {};
      estoque?.forEach(item => {
        estoqueMap[item.produto_id] = item.quantidade || 0;
      });

      // Processar produtos por loja
      const produtosPorLoja: Record<string, ProdutoRequisitado[]> = {};
      
      requisicoes?.forEach(req => {
        if (!produtosPorLoja[req.loja]) {
          produtosPorLoja[req.loja] = [];
        }

        (req.itens_requisicao as any[]).forEach(item => {
          const estoqueAtual = estoqueMap[item.produto_id] || 0;
          console.log(`Produto ${item.produtos?.produto}: estoque CD = ${estoqueAtual}`);
          
          const produto: ProdutoRequisitado = {
            produto_id: item.produto_id,
            produto_nome: item.produtos?.produto || '',
            loja: req.loja,
            quantidade_requisitada: item.quantidade || 0,
            quantidade_calculada: item.quantidade_calculada || 0,
            estoque_cd: estoqueAtual,
            quantidade_separar: item.quantidade_calculada || 0,
            confirmado: false,
            requisicao_id: req.id
          };

          produtosPorLoja[req.loja].push(produto);
        });
      });

      console.log('Produtos processados por loja:', produtosPorLoja);
      return produtosPorLoja;
    },
    enabled: !!cdLoja,
  });

  // Mutation para processar separação
  const processarSeparacaoMutation = useMutation({
    mutationFn: async ({ loja, produtos }: { loja: string; produtos: ProdutoRequisitado[] }) => {
      if (!cdLoja) throw new Error('Loja CD não encontrada');
      
      console.log('Processando separação para loja:', loja, produtos);

      const transferenciasParaCriar = produtos.map(produto => ({
        requisicao_id: produto.requisicao_id,
        produto_id: produto.produto_id,
        loja_origem: cdLoja,
        loja_destino: loja,
        quantidade_requisitada: produto.quantidade_calculada,
        quantidade_transferida: produto.quantidade_separar,
        status: 'separado',
        transferido_por: profile?.id
      }));

      // Criar transferências
      const { error: transferError } = await supabase
        .from('transferencias')
        .insert(transferenciasParaCriar);

      if (transferError) {
        console.error('Erro ao criar transferências:', transferError);
        throw transferError;
      }

      // Atualizar estoque do CD (descontar)
      for (const produto of produtos) {
        const novoEstoque = produto.estoque_cd - produto.quantidade_separar;
        
        const { error: estoqueError } = await supabase
          .from('estoque_atual')
          .update({ 
            quantidade: Math.max(0, novoEstoque),
            atualizado_em: new Date().toISOString()
          })
          .eq('produto_id', produto.produto_id)
          .eq('loja', cdLoja);

        if (estoqueError) {
          console.error('Erro ao atualizar estoque:', estoqueError);
          throw estoqueError;
        }
      }

      // Atualizar status das requisições para 'separado'
      const requisicaoIds = [...new Set(produtos.map(p => p.requisicao_id))];
      for (const reqId of requisicaoIds) {
        const { error: reqError } = await supabase
          .from('requisicoes')
          .update({ status: 'separado' })
          .eq('id', reqId);

        if (reqError) {
          console.error('Erro ao atualizar requisição:', reqError);
          throw reqError;
        }
      }

      console.log('Separação processada com sucesso');
    },
    onSuccess: () => {
      toast.success('Separação processada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['produtos-requisitados-cd'] });
      setModalConfirmacao({ aberto: false });
      setProdutosSeparacao({});
    },
    onError: (error: any) => {
      console.error('Erro ao processar separação:', error);
      toast.error('Erro ao processar separação: ' + error.message);
    },
  });

  const handleQuantidadeChange = (key: string, quantidade: number) => {
    setProdutosSeparacao(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        quantidade_separar: quantidade
      }
    }));
  };

  const handleConfirmadoChange = (key: string, confirmado: boolean) => {
    setProdutosSeparacao(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        confirmado
      }
    }));
  };

  const inicializarProduto = (produto: ProdutoRequisitado) => {
    const key = `${produto.loja}-${produto.produto_id}`;
    if (!produtosSeparacao[key]) {
      setProdutosSeparacao(prev => ({
        ...prev,
        [key]: { ...produto }
      }));
    }
    return produtosSeparacao[key] || produto;
  };

  const confirmarSeparacaoLoja = (loja: string) => {
    setModalConfirmacao({ aberto: true, loja });
  };

  const executarSeparacao = () => {
    if (!modalConfirmacao.loja) return;

    const produtosDaLoja = Object.values(produtosSeparacao).filter(
      p => p.loja === modalConfirmacao.loja && p.confirmado
    );

    if (produtosDaLoja.length === 0) {
      toast.error('Selecione pelo menos um produto para separar');
      return;
    }

    processarSeparacaoMutation.mutate({
      loja: modalConfirmacao.loja,
      produtos: produtosDaLoja
    });
  };

  if (isLoading || !cdLoja) {
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/gestao-cd')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Gestão de Transferências - CD</h1>
                <p className="text-sm text-gray-500">Separação e transferência de produtos</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setHistoricoModal({ aberto: true })}
            >
              <History className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {produtosRequisitados && Object.keys(produtosRequisitados).length > 0 ? (
          Object.entries(produtosRequisitados).map(([loja, produtos]) => (
            <Card key={loja} className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    {loja}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{produtos.length} produtos</Badge>
                    <Button
                      onClick={() => confirmarSeparacaoLoja(loja)}
                      disabled={processarSeparacaoMutation.isPending}
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Confirmar Separação
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Requisitado (Kg)</TableHead>
                      <TableHead>Estoque CD</TableHead>
                      <TableHead>Quantidade a Separar</TableHead>
                      <TableHead>Confirmar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => {
                      const key = `${produto.loja}-${produto.produto_id}`;
                      const produtoAtual = inicializarProduto(produto);
                      const temEstoque = produto.estoque_cd >= produto.quantidade_calculada;
                      
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{produto.produto_nome}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Scale className="h-4 w-4 mr-1" />
                              {produto.quantidade_calculada}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{produto.estoque_cd}</span>
                              {!temEstoque && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max={produto.estoque_cd}
                              value={produtoAtual.quantidade_separar}
                              onChange={(e) => handleQuantidadeChange(key, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Checkbox
                              checked={produtoAtual.confirmado}
                              onCheckedChange={(checked) => handleConfirmadoChange(key, checked as boolean)}
                              disabled={!temEstoque || produtoAtual.quantidade_separar <= 0}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma requisição pendente para separação</p>
            </CardContent>
          </Card>
        )}

        {/* Modal de Confirmação */}
        <Dialog open={modalConfirmacao.aberto} onOpenChange={(aberto) => setModalConfirmacao({ aberto })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Separação</DialogTitle>
              <DialogDescription>
                Deseja confirmar a separação dos produtos selecionados para {modalConfirmacao.loja}?
                Esta ação irá atualizar o estoque do CD e criar as transferências.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setModalConfirmacao({ aberto: false })}
              >
                Cancelar
              </Button>
              <Button
                onClick={executarSeparacao}
                disabled={processarSeparacaoMutation.isPending}
              >
                {processarSeparacaoMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico */}
        <HistoricoTransferencia
          transferenceId={historicoModal.transferenceId || null}
          isOpen={historicoModal.aberto}
          onClose={() => setHistoricoModal({ aberto: false })}
        />
      </main>
    </div>
  );
};

export default TransferenciasCD;
