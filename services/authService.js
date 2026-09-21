import { apiPost, apiGet, apiPut } from './api';
import { STORAGE_KEYS } from '../constants/storageKeys';
import {
  saveItem,
  getItem,
  removeItem,
  saveRegisteredAccount,
  findRegisteredAccount,
  seedDemoData,
} from './offlineStorage';

const TOKEN_KEY = (STORAGE_KEYS && STORAGE_KEYS.AUTH_TOKEN) || '@skilltracker_token';
const USER_KEY = (STORAGE_KEYS && STORAGE_KEYS.USER_DATA) || '@skilltracker_user';


export const register = async (userData) => {
  const normalizedEmail = (userData.email || '').trim().toLowerCase();
  const rawPassword = userData.password;

  const offlineUser = {
    id: 'usr_' + Date.now(),
    name: userData.name?.trim(),
    email: normalizedEmail,
    phone: userData.phone?.trim() || '',
    college: userData.college?.trim() || '',
    department: userData.department?.trim() || '',
    year: userData.year?.trim() || '',
    skillsCount: 0,
    streak: 1,
  };
  const offlineToken = 'jwt_offline_' + Date.now();

  // Save account locally first so user is never locked out
  await saveRegisteredAccount({
    name: userData.name?.trim(),
    email: normalizedEmail,
    password: rawPassword,
    phone: userData.phone?.trim() || '',
    college: userData.college?.trim() || '',
    department: userData.department?.trim() || '',
    year: userData.year?.trim() || '',
    user: offlineUser,
    token: offlineToken,
  });

  // Try online server registration
  try {
    const res = await apiPost('/api/auth/register', {
      ...userData,
      email: normalizedEmail,
    });
    if (res.success && res.data?.token) {
      await saveItem(TOKEN_KEY, res.data.token);
      await saveItem(USER_KEY, res.data.user);
      await saveRegisteredAccount({
        name: userData.name?.trim(),
        email: normalizedEmail,
        password: rawPassword,
        user: res.data.user,
        token: res.data.token,
      });
      return res;
    }
  } catch (e) {
    console.warn('Server registration error, using offline account:', e);
  }

  // Fallback to local offline account
  await seedDemoData();
  await saveItem(TOKEN_KEY, offlineToken);
  await saveItem(USER_KEY, offlineUser);

  return {
    success: true,
    data: { token: offlineToken, user: offlineUser },
    isOffline: true,
    message: 'Account created and saved to device!',
  };
};

export const login = async (credentials) => {
  const normalizedEmail = (credentials.email || '').trim().toLowerCase();
  const enteredPassword = credentials.password;

  // 1. Try server login first (fast 2.5s timeout via apiPost)
  try {
    const res = await apiPost('/api/auth/login', {
      email: normalizedEmail,
      password: enteredPassword,
    });

    if (res.success && res.data?.token) {
      await saveItem(TOKEN_KEY, res.data.token);
      await saveItem(USER_KEY, res.data.user);
      await saveRegisteredAccount({
        email: normalizedEmail,
        password: enteredPassword,
        user: res.data.user,
        token: res.data.token,
      });
      return res;
    }
  } catch (e) {
    console.warn('Server login error, checking local device accounts:', e);
  }

  // 2. If server was offline or unreachable, check local device accounts!
  const localAccount = await findRegisteredAccount(normalizedEmail);
  if (localAccount) {
    if (localAccount.password === enteredPassword) {
      const user = localAccount.user || {
        id: 'usr_' + Date.now(),
        name: localAccount.name || 'Student',
        email: normalizedEmail,
        phone: localAccount.phone || '',
        college: localAccount.college || '',
        department: localAccount.department || '',
        year: localAccount.year || '',
      };
      const token = localAccount.token || ('jwt_offline_' + Date.now());

      await seedDemoData();
      await saveItem(TOKEN_KEY, token);
      await saveItem(USER_KEY, user);

      return {
        success: true,
        data: { token, user },
        isOffline: true,
        message: 'Signed in locally (Offline mode active)',
      };
    } else {
      return {
        success: false,
        error: 'Incorrect password. Please try again.',
      };
    }
  }

  // 3. Neither server reached nor local account found
  return {
    success: false,
    error: 'Invalid email or password. Please verify credentials.',
  };
};

export const getCurrentUser = async () => {
  const cachedUser = await getItem(USER_KEY);
  const res = await apiGet('/api/auth/me');
  if (res.success && res.data.user) {
    await saveItem(USER_KEY, res.data.user);
    return res.data.user;
  }
  return cachedUser;
};

export const updateProfile = async (userData) => {
  const res = await apiPut('/api/auth/me', userData);
  if (res.success && res.data.user) {
    await saveItem(USER_KEY, res.data.user);
  }
  return res;
};

export const logout = async () => {
  await removeItem(TOKEN_KEY);
  await removeItem(USER_KEY);
};

export const checkAuthStatus = async () => {
  const token = await getItem(TOKEN_KEY);
  const user = await getItem(USER_KEY);
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
