import {
  getItem,
  saveItem,
  getCachedData,
  setCachedData,
  getOfflineQueue,
  queueOfflineAction,
  removeQueueItem,
  clearOfflineQueue,
} from './offlineStorage.js';
import { AUTH_TOKEN, OFFLINE_QUEUE, LAST_SYNC_TIME, STORAGE_KEYS } from '../constants/storageKeys.js';
import { getBaseApiUrl } from './apiUrl.js';

const TOKEN_KEY = AUTH_TOKEN || STORAGE_KEYS?.AUTH_TOKEN || '@skilltracker_token';
const QUEUE_KEY = OFFLINE_QUEUE || STORAGE_KEYS?.OFFLINE_QUEUE || '@skilltracker_offline_queue';
const SYNC_TIME_KEY = LAST_SYNC_TIME || STORAGE_KEYS?.LAST_SYNC_TIME || '@skilltracker_last_sync_time';

let syncListeners = [];

export const notifySyncListeners = (status) => {
  syncListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (e) {
      console.warn('[Sync listener error]', e);
    }
  });
};

export const subscribeToSync = (callback) => {
  syncListeners.push(callback);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== callback);
  };
};

export const getPendingSyncCount = async () => {
  const queue = await getOfflineQueue();
  return queue.length;
};

export const checkServerReachability = async () => {
  try {
    const baseUrl = await getBaseApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
};

export const syncOfflineQueue = async () => {
  const queue = await getOfflineQueue();
  if (!queue.length) {
    return { success: true, syncedCount: 0, remainingCount: 0 };
  }

  const isReachable = await checkServerReachability();
  if (!isReachable) {
    return { success: false, syncedCount: 0, remainingCount: queue.length, reason: 'offline' };
  }

  notifySyncListeners({ type: 'sync_start', pendingCount: queue.length });

  const baseUrl = await getBaseApiUrl();
  const token = await getItem(TOKEN_KEY);
  const remainingQueue = [];
  let syncedCount = 0;

  for (const action of queue) {
    try {
      const url = `${baseUrl}${action.endpoint.startsWith('/') ? action.endpoint : `/${action.endpoint}`}`;
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options = {
        method: action.method,
        headers,
      };

      if (action.body && action.method !== 'GET') {
        options.body = JSON.stringify(action.body);
      }

      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 4000);
      options.signal = controller.signal;

      const response = await fetch(url, options);
      clearTimeout(tid);

      if (response.ok) {
        syncedCount++;
        // If it was a POST creation and server responded with real item data,
        // reconcile temporary local ID with real MongoDB ID
        if (action.method === 'POST' && action.tempId && action.collectionKey) {
          try {
            const data = await response.json();
            const serverItem = data.skill || data.task || data.exam || data.expense || data.data || data;
            if (serverItem && (serverItem._id || serverItem.id)) {
              const realId = serverItem._id || serverItem.id;
              const cached = await getCachedData(action.endpoint);
              if (cached && Array.isArray(cached[action.collectionKey])) {
                cached[action.collectionKey] = cached[action.collectionKey].map((item) =>
                  item._id === action.tempId || item.id === action.tempId ? { ...item, _id: realId } : item
                );
                await setCachedData(action.endpoint, cached);
              }
            }
          } catch (jsonErr) {
            console.warn('[Sync ID reconciliation warn]', jsonErr);
          }
        }
      } else if (response.status >= 400 && response.status < 500) {
        // Bad request or validation error - discard corrupted queue item
        console.warn(`[Sync skipped invalid action ${action.id}]: Status ${response.status}`);
      } else {
        // Server 5xx error - keep for next retry
        action.retries = (action.retries || 0) + 1;
        remainingQueue.push(action);
      }
    } catch (networkError) {
      // Network broke mid-sync, keep remaining items
      action.retries = (action.retries || 0) + 1;
      remainingQueue.push(action);
      break;
    }
  }

  await saveItem(QUEUE_KEY, remainingQueue);
  await saveItem(SYNC_TIME_KEY, Date.now());

  notifySyncListeners({
    type: 'sync_finish',
    syncedCount,
    remainingCount: remainingQueue.length,
  });

  return {
    success: true,
    syncedCount,
    remainingCount: remainingQueue.length,
  };
};

export default {
  getOfflineQueue,
  getPendingSyncCount,
  queueOfflineAction,
  removeQueueItem,
  clearOfflineQueue,
  checkServerReachability,
  syncOfflineQueue,
  subscribeToSync,
  notifySyncListeners,
};
