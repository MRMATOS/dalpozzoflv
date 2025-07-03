import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  CheckCircle, 
  Scale,
  Clock,
  Eye
} from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';

const HistoricoRecebimentos = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  // Buscar histórico de recebimentos
  const { data: recebimentos, isLoading } = useQuery({
    queryKey: ['historico-recebimentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recebimentos')
        .select(`
          *,
          recebimentos_produtos(
            id,
            produto_nome,
            peso_liquido_kg,
            quantidade_caixas,
            loja_destino
          )
        `)
        .eq('status', 'finalizado')
        .order('finalizado_em', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatPeso = (peso: number) => {
    return `${peso.toFixed(1)} kg`;
  };

  const getTotalProdutos = (produtos: any[]) => {
    return produtos?.length || 0;
  };

  const getTotalPeso = (produtos: any[]) => {
    return produtos?.reduce((acc, p) => acc + (p.peso_liquido_kg || 0), 0) || 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
                onClick={() => navigate('/recebimento')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              {!isMobile && (
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Histórico de Recebimentos</h1>
                  <p className="text-sm text-gray-500">Centro de Distribuição - {profile?.nome}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Título mobile */}
      {isMobile && (
        <div className="bg-white border-b px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-lg font-semibold text-gray-900">Histórico de Recebimentos</h1>
            <p className="text-sm text-gray-600">Recebimentos finalizados</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
              Recebimentos Finalizados
            </CardTitle>
            <CardDescription>
              Histórico dos últimos 50 recebimentos finalizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recebimentos && recebimentos.length > 0 ? (
              <div className="space-y-4">
                {recebimentos.map((recebimento) => (
                  <div key={recebimento.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
                      <div className="flex-1">
                        <div className={`flex items-center ${isMobile ? 'justify-between mb-2' : 'space-x-3 mb-2'}`}>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Finalizado
                          </Badge>
                          {recebimento.fornecedor && (
                            <span className="text-sm font-medium text-gray-700">
                              {recebimento.fornecedor}
                            </span>
                          )}
                        </div>
                        
                        <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-3 gap-4'}`}>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(recebimento.finalizado_em)}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Package className="h-4 w-4 mr-1" />
                            {getTotalProdutos(recebimento.recebimentos_produtos)} produtos
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Scale className="h-4 w-4 mr-1" />
                            {formatPeso(getTotalPeso(recebimento.recebimentos_produtos))}
                          </div>
                        </div>

                        {recebimento.origem && (
                          <p className="text-xs text-gray-500 mt-2">
                            Origem: {recebimento.origem}
                          </p>
                        )}
                        
                        {recebimento.observacoes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Obs: {recebimento.observacoes}
                          </p>
                        )}
                      </div>
                      
                      {!isMobile && (
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/recebimento/${recebimento.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalhes
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {isMobile && (
                      <div className="mt-3 pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/recebimento/${recebimento.id}`)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum recebimento encontrado
                </h3>
                <p className="text-gray-500 mb-6">
                  Ainda não há recebimentos finalizados no sistema.
                </p>
                <Button onClick={() => navigate('/recebimento/novo')}>
                  Iniciar Primeiro Recebimento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default HistoricoRecebimentos;