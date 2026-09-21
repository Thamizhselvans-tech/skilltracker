import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@skilltracker_token',
  USER_DATA: '@skilltracker_user',
  API_URL: '@skilltracker_api_url',
  THEME_MODE: '@skilltracker_theme_mode',
  CACHE_PREFIX: '@skilltracker_cache_',
  OFFLINE_QUEUE: '@skilltracker_offline_queue',
};

export const saveItem = async (key, value) => {
  try {
    const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error(`[AsyncStorage Save Error: ${key}]`, e);
  }
};

export const getItem = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (e) {
    console.error(`[AsyncStorage Get Error: ${key}]`, e);
    return null;
  }
};

export const removeItem = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error(`[AsyncStorage Remove Error: ${key}]`, e);
  }
};

// Data Caching Helpers for Offline Access
export const setCachedData = async (endpoint, data) => {
  return await saveItem(`${STORAGE_KEYS.CACHE_PREFIX}${endpoint}`, {
    timestamp: Date.now(),
    data,
  });
};

export const getCachedData = async (endpoint) => {
  const cached = await getItem(`${STORAGE_KEYS.CACHE_PREFIX}${endpoint}`);
  return cached ? cached.data : null;
};

export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(STORAGE_KEYS.CACHE_PREFIX));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (e) {
    console.error('[AsyncStorage Clear Cache Error]', e);
  }
};

export default {
  STORAGE_KEYS,
  saveItem,
  getItem,
  removeItem,
  setCachedData,
  getCachedData,
  clearAllCache,
};
