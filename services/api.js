import { DEFAULT_API_URL } from '../constants/config';
import { getItem, saveItem, getCachedData, setCachedData, STORAGE_KEYS } from './offlineStorage';

let currentBaseUrl = DEFAULT_API_URL;

export const setCustomApiUrl = async (url) => {
  currentBaseUrl = url.trim().replace(/\/+$/, '');
  await saveItem(STORAGE_KEYS.API_URL, currentBaseUrl);
  return currentBaseUrl;
};

export const getBaseApiUrl = async () => {
  const savedUrl = await getItem(STORAGE_KEYS.API_URL);
  if (savedUrl) {
    currentBaseUrl = savedUrl;
  }
  return currentBaseUrl;
};

export const requestApi = async (endpoint, method = 'GET', body = null) => {
  const baseUrl = await getBaseApiUrl();
  const token = await getItem(STORAGE_KEYS.AUTH_TOKEN);

  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const isAuth = endpoint.includes('/auth');
    const controller = new AbortController();
    const timeoutDuration = isAuth ? 3500 : 8000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    // Cache successful GET responses for offline mode
    if (method === 'GET') {
      await setCachedData(endpoint, data);
    }

    return {
      success: true,
      data,
      isOffline: false,
    };
  } catch (error) {
    console.warn(`[API Error: ${method} ${endpoint}]`, error.message);

    // If GET failed (offline/network issue), check local cache
    if (method === 'GET') {
      const cached = await getCachedData(endpoint);
      if (cached) {
        return {
          success: true,
          data: cached,
          isOffline: true,
          error: error.message,
        };
      }
    }

    const isNetworkAbort = error.name === 'AbortError' || error.message?.includes('aborted') || error.message?.includes('Network request failed');
    const helpfulMsg = isNetworkAbort
      ? `Cannot reach server at ${baseUrl}. Tap "Server IP" or use "Instant Demo Login".`
      : (error.message || 'Network error, please check connection');

    return {
      success: false,
      error: helpfulMsg,
      isNetworkError: isNetworkAbort,
      isOffline: true,
    };
  }
};

export const apiGet = (endpoint) => requestApi(endpoint, 'GET');
export const apiPost = (endpoint, data) => requestApi(endpoint, 'POST', data);
export const apiPut = (endpoint, data) => requestApi(endpoint, 'PUT', data);
export const apiDelete = (endpoint) => requestApi(endpoint, 'DELETE');

export default {
  requestApi,
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  setCustomApiUrl,
  getBaseApiUrl,
};
