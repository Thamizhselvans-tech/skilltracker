import { apiPost, apiGet, apiPut } from './api';
import {
  saveItem,
  getItem,
  removeItem,
  STORAGE_KEYS,
  saveRegisteredAccount,
  findRegisteredAccount,
  seedDemoData,
} from './offlineStorage';

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
      await saveItem(STORAGE_KEYS.AUTH_TOKEN, res.data.token);
      await saveItem(STORAGE_KEYS.USER_DATA, res.data.user);
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
  await saveItem(STORAGE_KEYS.AUTH_TOKEN, offlineToken);
  await saveItem(STORAGE_KEYS.USER_DATA, offlineUser);

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
      await saveItem(STORAGE_KEYS.AUTH_TOKEN, res.data.token);
      await saveItem(STORAGE_KEYS.USER_DATA, res.data.user);
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
      await saveItem(STORAGE_KEYS.AUTH_TOKEN, token);
      await saveItem(STORAGE_KEYS.USER_DATA, user);

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
