import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SyncStatusIndicator from './SyncStatusIndicator';
import { SyncStatus } from '@/hooks/useSyncStatus';
import SystemAnnouncement from '@/components/SystemAnnouncement';

interface Profile {
  nome?: string | null;
}

interface CotacaoHeaderProps {
  profile: Profile | null;
  syncStatus: SyncStatus;
  formatLastSyncTime: () => string;
  onRetrySync?: () => void;
  onRestaurarCotacao: () => void;
}

const CotacaoHeader: React.FC<CotacaoHeaderProps> = ({ 
  profile, 
  syncStatus, 
  formatLastSyncTime, 
  onRetrySync,
  onRestaurarCotacao
}) => {
  const navigate = useNavigate();

  return (
    <>
      <SystemAnnouncement />
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <SyncStatusIndicator
              syncStatus={syncStatus}
              formatLastSyncTime={formatLastSyncTime}
              onRetry={onRetrySync}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRestaurarCotacao}
                    className="flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Restaurar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Restaurar último rascunho</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default CotacaoHeader;
