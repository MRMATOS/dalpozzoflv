
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar, Package, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoRequisicao {
  id: string;
  data_requisicao: string;
  loja: string;
  status: string;
  itens: Array<{
    produto_nome: string;
    quantidade_calculada: number;
    unidade: string;
  }>;
}

const HistoricoRequisicoes = () => {
  const navigate = useNavigate();
  const [lojaFiltro, setLojaFiltro] = useState<string>('');

  const { data: requisicoes, isLoading } = useQuery({
    queryKey: ['historico-requisicoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requisicoes')
        .select(`
          id,
          data_requisicao,
          loja,
          status,
          itens_requisicao (
            quantidade_calculada,
            produtos (
              produto,
              unidade
            )
          )
        `)
        .order('data_requisicao', { ascending: false });

      if (error) throw error;

      return data?.map(req => ({
        id: req.id,
        data_requisicao: req.data_requisicao,
        loja: req.loja,
        status: req.status,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
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
                    <div>
                      <CardTitle className="text-base flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        {requisicao.loja}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
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
