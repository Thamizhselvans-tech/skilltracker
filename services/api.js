import { DEFAULT_API_URL } from '../constants/config.js';
import { AUTH_TOKEN, STORAGE_KEYS } from '../constants/storageKeys.js';
import {
  getItem,
  saveItem,
  getCachedData,
  setCachedData,
  queueOfflineAction,
} from './offlineStorage.js';
import { getBaseApiUrl, setCustomApiUrl } from './apiUrl.js';

export { getBaseApiUrl, setCustomApiUrl };

const TOKEN_STORAGE_KEY = AUTH_TOKEN || STORAGE_KEYS?.AUTH_TOKEN || '@skilltracker_token';

export const requestApi = async (endpoint, method = 'GET', body = null) => {
  const baseUrl = await getBaseApiUrl();
  const token = await getItem(TOKEN_STORAGE_KEY);

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
    const timeoutDuration = isAuth ? 3000 : 4500;

    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        const err = new Error('NETWORK_TIMEOUT');
        err.name = 'TimeoutError';
        reject(err);
      }, timeoutDuration);
    });

    const fetchPromise = fetch(url, options).then(async (response) => {
      clearTimeout(timeoutId);
      let data = {};
      try {
        data = await response.json();
      } catch {
        data = { message: `Server error (${response.status})` };
      }

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    });

    const data = await Promise.race([fetchPromise, timeoutPromise]);

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

    const isTimeout = error.name === 'TimeoutError' || error.message === 'NETWORK_TIMEOUT';
    const isNetworkAbort =
      isTimeout ||
      error.name === 'AbortError' ||
      error.message?.includes('aborted') ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('Failed to fetch');

    // For non-auth mutations (POST, PUT, DELETE), queue for automatic sync when server or database is unreachable
    if ((isNetworkAbort || error.status === 503) && method !== 'GET' && !endpoint.includes('/auth')) {
      try {
        const inferCollectionKey = (ep) => {
          if (ep.includes('skills')) return 'skills';
          if (ep.includes('planner')) return 'tasks';
          if (ep.includes('timetable')) return 'timetable';
          if (ep.includes('internal-exams')) return 'internalExams';
          if (ep.includes('external-exams')) return 'externalExams';
          if (ep.includes('expenses')) return 'expenses';
          if (ep.includes('practice')) return 'sessions';
          return 'items';
        };

        const tempId = body?._id || body?.id || ('temp_' + Date.now());
        const collectionKey = inferCollectionKey(endpoint);

        await queueOfflineAction({
          endpoint,
          method,
          body,
          tempId,
          collectionKey,
        });

        return {
          success: true,
          data: body ? { ...body, _id: tempId } : { success: true },
          isOffline: true,
          queued: true,
          message: 'Saved offline. Will sync automatically when connection is restored.',
        };
      } catch (queueErr) {
        console.warn('[Queue mutation fallback error]', queueErr);
      }
    }

    const helpfulMsg = isNetworkAbort
      ? `Cannot reach server at ${baseUrl}. Using local offline mode.`
      : (error.message || 'Network error, please check connection');

    return {
      success: false,
      error: helpfulMsg,
      status: error.status || 0,
      isNetworkError: isNetworkAbort,
      isOffline: isNetworkAbort,
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
