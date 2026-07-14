import { useEffect, useCallback, useState } from 'react';
import { syncService } from './SyncService';

/**
 * Hook to initialize and manage the sync service
 * Should be called once in the main App component
 */
export const useSyncEffect = () => {
  const [syncStatus, setSyncStatus] = useState({
    lastSync: 0,
    isSyncing: false,
    stationCount: 0,
    error: null as string | null,
  });

  // Initialize sync service
  useEffect(() => {
    console.log('🚀 Initializing sync effect...');

    // Set up event listeners
    const handleSyncComplete = (data: any) => {
      console.log('✅ Sync completed:', data);
      setSyncStatus({
        lastSync: data.timestamp,
        isSyncing: false,
        stationCount: data.stations?.length || 0,
        error: null,
      });
    };

    const handleSyncError = (data: any) => {
      console.error('❌ Sync error:', data);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: data.error,
      }));
    };

    const handleStationChanged = (data: any) => {
      console.log('🔔 Station changed:', data);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
      }));
    };

    const handleProductChanged = (data: any) => {
      console.log('🔔 Product changed:', data);
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
      }));
    };

    // Register listeners
    syncService.on('sync-complete', handleSyncComplete);
    syncService.on('sync-error', handleSyncError);
    syncService.on('station-changed', handleStationChanged);
    syncService.on('product-changed', handleProductChanged);

    // Initialize the sync service
    syncService.initialize().catch((error) => {
      console.error('❌ Failed to initialize sync service:', error);
      setSyncStatus((prev) => ({
        ...prev,
        error: error.message,
      }));
    });

    // Cleanup function
    return () => {
      syncService.off('sync-complete', handleSyncComplete);
      syncService.off('sync-error', handleSyncError);
      syncService.off('station-changed', handleStationChanged);
      syncService.off('product-changed', handleProductChanged);
      syncService.destroy();
    };
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    console.log('🔄 Manual sync triggered');
    setSyncStatus((prev) => ({ ...prev, isSyncing: true }));
    await syncService.syncNow();
  }, []);

  // Get current status
  const getStatus = useCallback(() => {
    return syncService.getStatus();
  }, []);

  // Get synced data
  const getSyncedData = useCallback(() => {
    return syncService.getSyncedData();
  }, []);

  return {
    syncStatus,
    triggerSync,
    getStatus,
    getSyncedData,
  };
};

export default useSyncEffect;
