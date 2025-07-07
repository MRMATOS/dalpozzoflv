
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Package, MapPin, Users, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoRequisicao {
  id: string;
  data_requisicao: string;
  loja: string;
  status: string;
  usuario_nome?: string;
  usuario_tipo?: string;
  itens: Array<{
    produto_nome: string;
    quantidade_calculada: number;
    unidade: string;
  }>;
}

interface HistoricoRequisicoesProps {
  embedded?: boolean;
}

const HistoricoRequisicoes = ({ embedded = false }: HistoricoRequisicoesProps) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lojaFiltro, setLojaFiltro] = useState<string>('');
  const [visualizarTodas, setVisualizarTodas] = useState<boolean>(false);

  const isMaster = profile?.tipo === 'master';

  const { data: requisicoes, isLoading } = useQuery({
    queryKey: ['historico-requisicoes', visualizarTodas],
    queryFn: async () => {
      const query = supabase
        .from('requisicoes')
        .select(`
          id,
          data_requisicao,
          loja,
          status,
          usuario_id,
          usuarios!inner(nome, tipo),
          itens_requisicao (
            quantidade_calculada,
            produtos (
              produto,
              unidade
            )
          )
        `);

      // Se não é master ou não está visualizando todas, filtrar por loja do usuário
      if (!isMaster || !visualizarTodas) {
        query.eq('loja', profile?.loja || '');
      }

      const { data, error } = await query.order('data_requisicao', { ascending: false });

      if (error) throw error;

      return data?.map(req => ({
        id: req.id,
        data_requisicao: req.data_requisicao,
        loja: req.loja,
        status: req.status,
        usuario_nome: (req.usuarios as any)?.nome || 'Usuário não identificado',
        usuario_tipo: (req.usuarios as any)?.tipo || '',
        itens: req.itens_requisicao?.map(item => ({
          produto_nome: (item.produtos as any)?.produto || 'Produto não encontrado',
          quantidade_calculada: item.quantidade_calculada || 0,
          unidade: (item.produtos as any)?.unidade || ''
        })) || []
      })) as HistoricoRequisicao[];
    },
  });

  const requisicoesFiltradasPorLoja = requisicoes?.filter(req => 
    !lojaFiltro || req.loja === lojaFiltro
  ) || [];

  const lojasDisponiveis = [...new Set(requisicoes?.map(req => req.loja) || [])];

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'processando': 'bg-blue-100 text-blue-800',
      'concluida': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "min-h-screen bg-gray-50"}>
      {/* Header - Only show if not embedded */}
      {!embedded && (
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Histórico de Requisições
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 items-center flex-wrap">
              {/* Toggle para Masters */}
              {isMaster && (
                <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Eye className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Visualizar todas as requisições</span>
                  <Switch
                    checked={visualizarTodas}
                    onCheckedChange={setVisualizarTodas}
                  />
                  {visualizarTodas && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                      Modo Admin
                    </Badge>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <select
                  value={lojaFiltro}
                  onChange={(e) => setLojaFiltro(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="">Todas as lojas</option>
                  {lojasDisponiveis.map(loja => (
                    <option key={loja} value={loja}>{loja}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Requisições */}
        <div className="space-y-4">
          {requisicoesFiltradasPorLoja.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma requisição encontrada</p>
              </CardContent>
            </Card>
          ) : (
            requisicoesFiltradasPorLoja.map((requisicao) => (
              <Card key={requisicao.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-base flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          {requisicao.loja}
                        </CardTitle>
                        {visualizarTodas && requisicao.usuario_nome && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {requisicao.usuario_nome}
                            </Badge>
                            {requisicao.usuario_tipo && (
                              <Badge variant="secondary" className="text-xs">
                                {requisicao.usuario_tipo}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {format(new Date(requisicao.data_requisicao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(requisicao.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700 mb-3">
                      Produtos requisitados ({requisicao.itens.length} itens):
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Unidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requisicao.itens.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.produto_nome}</TableCell>
                            <TableCell>{item.quantidade_calculada}</TableCell>
                            <TableCell>{item.unidade}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default HistoricoRequisicoes;
