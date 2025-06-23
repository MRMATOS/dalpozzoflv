
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificacaoItem {
  id: string;
  tipo: 'transferencia_pendente' | 'divergencia' | 'recebimento_confirmado';
  titulo: string;
  descricao: string;
  urgencia: 'baixa' | 'media' | 'alta';
  data: string;
  loja?: string;
}

const NotificacoesTransferencias: React.FC = () => {
  const { profile } = useAuth();

  const { data: notificacoes, isLoading } = useQuery({
    queryKey: ['notificacoes-transferencias', profile?.loja],
    queryFn: async () => {
      const notificacoesList: NotificacaoItem[] = [];

      // Transferências pendentes para lojas
      if (profile?.loja && profile.loja !== 'Home') {
        const { data: transferencias } = await supabase
          .from('transferencias')
          .select(`
            id,
            loja_destino,
            quantidade_transferida,
            criado_em,
            produtos(produto)
          `)
          .eq('loja_destino', profile.loja)
          .eq('status', 'transferido');

        transferencias?.forEach(transfer => {
          const horasDecorridas = (new Date().getTime() - new Date(transfer.criado_em).getTime()) / (1000 * 60 * 60);
          notificacoesList.push({
            id: `transfer-${transfer.id}`,
            tipo: 'transferencia_pendente',
            titulo: 'Transferência aguardando confirmação',
            descricao: `${transfer.quantidade_transferida} unidades de ${(transfer.produtos as any)?.produto} aguardam confirmação`,
            urgencia: horasDecorridas > 24 ? 'alta' : horasDecorridas > 12 ? 'media' : 'baixa',
            data: transfer.criado_em,
            loja: transfer.loja_destino
          });
        });
      }

      // Divergências para CD
      if (profile?.loja === 'Home') {
        const { data: divergencias } = await supabase
          .from('divergencias_transferencias')
          .select(`
            id,
            tipo_divergencia,
            descricao,
            criado_em,
            transferencias(loja_destino)
          `)
          .eq('resolvido', false);

        divergencias?.forEach(divergencia => {
          notificacoesList.push({
            id: `divergencia-${divergencia.id}`,
            tipo: 'divergencia',
            titulo: `Divergência de ${divergencia.tipo_divergencia}`,
            descricao: divergencia.descricao,
            urgencia: 'alta',
            data: divergencia.criado_em,
            loja: (divergencia.transferencias as any)?.loja_destino
          });
        });
      }

      // Ordenar por urgência e data
      return notificacoesList.sort((a, b) => {
        const urgenciaOrder = { alta: 3, media: 2, baixa: 1 };
        if (urgenciaOrder[a.urgencia] !== urgenciaOrder[b.urgencia]) {
          return urgenciaOrder[b.urgencia] - urgenciaOrder[a.urgencia];
        }
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      });
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const getIcone = (tipo: string) => {
    switch (tipo) {
      case 'transferencia_pendente':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'divergencia':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'recebimento_confirmado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCorUrgencia = (urgencia: string) => {
    switch (urgencia) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTempoDecorrido = (data: string) => {
    const agora = new Date();
    const dataNotificacao = new Date(data);
    const diffMs = agora.getTime() - dataNotificacao.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHoras > 0) {
      return `${diffHoras}h${diffMinutos > 0 ? ` ${diffMinutos}m` : ''} atrás`;
    }
    return `${diffMinutos}m atrás`;
  };

  if (isLoading) {
    return <div className="text-center py-4">Carregando notificações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-blue-600" />
          Notificações
          {notificacoes && notificacoes.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {notificacoes.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notificacoes && notificacoes.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notificacoes.slice(0, 10).map((notificacao) => (
              <div
                key={notificacao.id}
                className="flex items-start space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-1">
                  {getIcone(notificacao.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {notificacao.titulo}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getCorUrgencia(notificacao.urgencia)}`}
                    >
                      {notificacao.urgencia}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notificacao.descricao}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {getTempoDecorrido(notificacao.data)}
                    </div>
                    {notificacao.loja && (
                      <Badge variant="outline" className="text-xs">
                        {notificacao.loja}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma notificação no momento.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificacoesTransferencias;
