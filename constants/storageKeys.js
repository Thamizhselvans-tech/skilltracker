// Centralized Storage & Constants System for SkillTracker
// Export direct string constants to prevent any circular dependency or undefined module issues.

export const AUTH_TOKEN = '@skilltracker_token';
export const USER_DATA = '@skilltracker_user';
export const USER_ID = '@skilltracker_user_id';
export const API_URL = '@skilltracker_api_url';
export const THEME_MODE = '@skilltracker_theme_mode';
export const CACHE_PREFIX = '@skilltracker_cache_';
export const OFFLINE_QUEUE = '@skilltracker_offline_queue';
export const REGISTERED_ACCOUNTS = '@skilltracker_registered_accounts';
export const LAST_SYNC_TIME = '@skilltracker_last_sync_time';

export const STORAGE_KEYS = Object.freeze({
  AUTH_TOKEN,
  USER_DATA,
  USER_ID,
  API_URL,
  THEME_MODE,
  CACHE_PREFIX,
  OFFLINE_QUEUE,
  REGISTERED_ACCOUNTS,
  LAST_SYNC_TIME,
});

export const getStorageKey = (keyName) => {
  return STORAGE_KEYS[keyName] || `@skilltracker_${String(keyName).toLowerCase()}`;
};

export default STORAGE_KEYS;
