import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_API_URL } from '../constants/config';
import { STORAGE_KEYS } from '../constants/storageKeys';

let currentBaseUrl = DEFAULT_API_URL;
const API_URL_KEY = (STORAGE_KEYS && STORAGE_KEYS.API_URL) || '@skilltracker_api_url';

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
      currentBaseUrl = savedUrl;
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
