import { useState, useEffect, useCallback, useRef } from 'react';
import {
  checkServerReachability,
  getPendingSyncCount,
  syncOfflineQueue,
  subscribeToSync,
} from '../services/syncService';
import { getItem } from '../services/offlineStorage';

export const useNetworkSync = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const prevOnlineRef = useRef(true);

  const refreshState = useCallback(async () => {
    try {
      const [online, pending, lastSync] = await Promise.all([
        checkServerReachability(),
        getPendingSyncCount(),
        getItem('@skilltracker_last_sync_time'),
      ]);

      setIsOnline(online);
      setPendingCount(pending);
      if (lastSync) setLastSyncTime(lastSync);

      // Transitioned from offline to online: auto-sync!
      if (!prevOnlineRef.current && online && pending > 0) {
        triggerSync();
      }
      prevOnlineRef.current = online;
    } catch (e) {
      console.warn('[refreshState error]', e);
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncOfflineQueue();
      const [pending, lastSync] = await Promise.all([
        getPendingSyncCount(),
        getItem('@skilltracker_last_sync_time'),
      ]);
      setPendingCount(pending);
      if (lastSync) setLastSyncTime(lastSync);
      return result;
    } catch (e) {
      console.warn('[triggerSync error]', e);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  useEffect(() => {
    refreshState();

    // Periodic heartbeat check every 15 seconds
    const interval = setInterval(() => {
      refreshState();
    }, 15000);

    // Subscribe to sync event notifications
    const unsubscribe = subscribeToSync((event) => {
      if (event.pendingCount !== undefined) {
        setPendingCount(event.pendingCount);
      }
      if (event.type === 'sync_start') {
        setIsSyncing(true);
      } else if (event.type === 'sync_finish') {
        setIsSyncing(false);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [refreshState]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncNow: triggerSync,
    refreshStatus: refreshState,
  };
};

export default useNetworkSync;
