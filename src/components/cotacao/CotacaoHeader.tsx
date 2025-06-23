
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SyncStatusIndicator from './SyncStatusIndicator';
import { SyncStatus } from '@/hooks/useSyncStatus';

interface Profile {
  nome?: string | null;
}

interface CotacaoHeaderProps {
  profile: Profile | null;
  syncStatus: SyncStatus;
  formatLastSyncTime: () => string;
  onRetrySync?: () => void;
}

const CotacaoHeader: React.FC<CotacaoHeaderProps> = ({ 
  profile, 
  syncStatus, 
  formatLastSyncTime, 
  onRetrySync 
}) => {
  const navigate = useNavigate();

  return (
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
        </div>
      </div>
    </header>
  );
};

export default CotacaoHeader;
