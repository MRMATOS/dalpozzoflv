
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Package, AlertTriangle, CheckCircle, Scale } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HistoricoItem } from '@/types/transferencias';

interface HistoricoTransferenciaProps {
  transferenceId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const HistoricoTransferencia: React.FC<HistoricoTransferenciaProps> = ({
  transferenceId,
  isOpen,
  onClose
}) => {
  const { data: historico, isLoading } = useQuery({
    queryKey: ['historico-transferencia', transferenceId],
    queryFn: async () => {
      if (!transferenceId) return [];
      
      const { data, error } = await supabase
        .rpc('get_transferencia_historico', { transferencia_uuid: transferenceId });

      if (error) throw error;
      return data as HistoricoItem[];
    },
    enabled: !!transferenceId && isOpen,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'separado': return 'bg-blue-100 text-blue-800';
      case 'transferido': return 'bg-purple-100 text-purple-800';
      case 'recebido': return 'bg-green-100 text-green-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIcon = (item: HistoricoItem) => {
    if (item.tipo === 'divergencia') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    
    if (item.status_novo === 'recebido') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (item.quantidade_anterior !== null && item.quantidade_nova !== null) {
      return <Scale className="h-4 w-4 text-blue-500" />;
    }
    
    return <Package className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Histórico da Transferência
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="text-center py-8">Carregando histórico...</div>
          ) : historico && historico.length > 0 ? (
            <div className="space-y-4">
              {historico.map((item, index) => (
                <Card key={item.id} className={`border-l-4 ${
                  item.tipo === 'divergencia' ? 'border-l-red-500' : 'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getIcon(item)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-sm">{item.descricao}</h4>
                            {item.tipo === 'divergencia' && (
                              <Badge variant="destructive" className="text-xs">
                                Divergência
                              </Badge>
                            )}
                          </div>
                          
                          {item.status_anterior && item.status_novo && (
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className={getStatusColor(item.status_anterior)}>
                                {item.status_anterior}
                              </Badge>
                              <span className="text-gray-400">→</span>
                              <Badge variant="outline" className={getStatusColor(item.status_novo)}>
                                {item.status_novo}
                              </Badge>
                            </div>
                          )}
                          
                          {item.quantidade_anterior !== null && item.quantidade_nova !== null && (
                            <div className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Quantidade:</span>{' '}
                              {item.quantidade_anterior} → {item.quantidade_nova}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {item.usuario_nome}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(item.criado_em).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum histórico encontrado para esta transferência.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoTransferencia;
