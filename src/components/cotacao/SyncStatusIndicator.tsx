
import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SyncStatus } from '@/hooks/useSyncStatus';

interface SyncStatusIndicatorProps {
  syncStatus: SyncStatus;
  formatLastSyncTime: () => string;
  onRetry?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  syncStatus, 
  formatLastSyncTime, 
  onRetry 
}) => {
  const { isSyncing, hasUnsavedChanges, syncError, retryCount } = syncStatus;

  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-blue-600 text-sm">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Salvando cotação...</span>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-red-600 text-sm">
          <WifiOff className="h-3 w-3" />
          <span>Erro ao salvar</span>
          {retryCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {retryCount} tentativa{retryCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-yellow-600 text-sm">
        <AlertCircle className="h-3 w-3" />
        <span>Alterações pendentes</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-green-600 text-sm">
      <CheckCircle className="h-3 w-3" />
      <div className="flex flex-col">
        <span>Sincronizado</span>
        <span className="text-xs text-gray-500">{formatLastSyncTime()}</span>
      </div>
    </div>
  );
};

export default SyncStatusIndicator;
