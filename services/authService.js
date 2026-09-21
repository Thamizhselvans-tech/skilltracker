import { apiPost, apiGet, apiPut } from './api';
import { saveItem, getItem, removeItem, STORAGE_KEYS } from './offlineStorage';

export const register = async (userData) => {
  const res = await apiPost('/api/auth/register', userData);
  if (res.success && res.data.token) {
    await saveItem(STORAGE_KEYS.AUTH_TOKEN, res.data.token);
    await saveItem(STORAGE_KEYS.USER_DATA, res.data.user);
  }
  return res;
};

export const login = async (credentials) => {
  const res = await apiPost('/api/auth/login', credentials);
  if (res.success && res.data.token) {
    await saveItem(STORAGE_KEYS.AUTH_TOKEN, res.data.token);
    await saveItem(STORAGE_KEYS.USER_DATA, res.data.user);
  }
  return res;
};

export const getCurrentUser = async () => {
  const cachedUser = await getItem(STORAGE_KEYS.USER_DATA);
  const res = await apiGet('/api/auth/me');
  if (res.success && res.data.user) {
    await saveItem(STORAGE_KEYS.USER_DATA, res.data.user);
    return res.data.user;
  }
  return cachedUser;
};

export const updateProfile = async (userData) => {
  const res = await apiPut('/api/auth/me', userData);
  if (res.success && res.data.user) {
    await saveItem(STORAGE_KEYS.USER_DATA, res.data.user);
  }
  return res;
};

export const logout = async () => {
  await removeItem(STORAGE_KEYS.AUTH_TOKEN);
  await removeItem(STORAGE_KEYS.USER_DATA);
};

export const checkAuthStatus = async () => {
  const token = await getItem(STORAGE_KEYS.AUTH_TOKEN);
  const user = await getItem(STORAGE_KEYS.USER_DATA);
  return { isAuthenticated: Boolean(token), token, user };
};

export default {
  register,
  login,
  getCurrentUser,
  updateProfile,
  logout,
  checkAuthStatus,
};
