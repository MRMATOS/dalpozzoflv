
import { useState, useEffect, useCallback } from 'react';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  hasUnsavedChanges: boolean;
  syncError: string | null;
  retryCount: number;
}

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncTime: null,
    hasUnsavedChanges: false,
    syncError: null,
    retryCount: 0
  });

  const updateSyncStatus = useCallback((updates: Partial<SyncStatus>) => {
    setSyncStatus(prev => ({ ...prev, ...updates }));
  }, []);

  const startSync = useCallback(() => {
    updateSyncStatus({ isSyncing: true, syncError: null });
  }, [updateSyncStatus]);

  const completSync = useCallback(() => {
    updateSyncStatus({ 
      isSyncing: false, 
      lastSyncTime: new Date(), 
      hasUnsavedChanges: false,
      syncError: null,
      retryCount: 0
    });
  }, [updateSyncStatus]);

  const failSync = useCallback((error: string) => {
    updateSyncStatus({ 
      isSyncing: false, 
      syncError: error,
      retryCount: (prev) => prev + 1
    });
  }, [updateSyncStatus]);

  const markUnsavedChanges = useCallback(() => {
    updateSyncStatus({ hasUnsavedChanges: true });
  }, [updateSyncStatus]);

  const formatLastSyncTime = useCallback(() => {
    if (!syncStatus.lastSyncTime) return 'Nunca sincronizado';
    
    const now = new Date();
    const diff = now.getTime() - syncStatus.lastSyncTime.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 30) return 'Agora mesmo';
    if (seconds < 60) return `${seconds}s atrás`;
    if (minutes < 60) return `${minutes}m atrás`;
    
    return syncStatus.lastSyncTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [syncStatus.lastSyncTime]);

  return {
    syncStatus,
    startSync,
    completSync,
    failSync,
    markUnsavedChanges,
    formatLastSyncTime
  };
};
