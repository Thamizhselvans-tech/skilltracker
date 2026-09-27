import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from '../constants/config.js';
import { API_URL, STORAGE_KEYS } from '../constants/storageKeys.js';

let currentBaseUrl = DEFAULT_API_URL;
const API_URL_KEY = API_URL || STORAGE_KEYS?.API_URL || '@skilltracker_api_url';

export const setCustomApiUrl = async (url) => {
  currentBaseUrl = url.trim().replace(/\/+$/, '');
  try {
    await AsyncStorage.setItem(API_URL_KEY, currentBaseUrl);
  } catch (e) {
    console.error('[AsyncStorage Save API_URL Error]', e);
  }
  return currentBaseUrl;
};

export const getBaseApiUrl = async () => {
  try {
    const savedUrl = await AsyncStorage.getItem(API_URL_KEY);
    if (savedUrl) {
      if (
        savedUrl.includes('10.') ||
        savedUrl.includes('192.168.') ||
        savedUrl.includes('localhost') ||
        savedUrl.includes('127.0.0.1') ||
        savedUrl.includes('skilltracker-api.onrender.com')
      ) {
        currentBaseUrl = DEFAULT_API_URL;
        await AsyncStorage.setItem(API_URL_KEY, DEFAULT_API_URL);
      } else {
        currentBaseUrl = savedUrl;
      }
    } else {
      currentBaseUrl = DEFAULT_API_URL;
    }
  } catch (e) {
    console.error('[AsyncStorage Get API_URL Error]', e);
  }
  return currentBaseUrl;
};

export default {
  setCustomApiUrl,
  getBaseApiUrl,
};
