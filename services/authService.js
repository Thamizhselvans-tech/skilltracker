import { apiPost, apiGet, apiPut } from './api.js';
import { AUTH_TOKEN, USER_DATA, USER_ID, STORAGE_KEYS } from '../constants/storageKeys.js';
import {
  saveItem,
  getItem,
  removeItem,
  saveRegisteredAccount,
  findRegisteredAccount,
  updateRegisteredAccount,
  seedDemoData,
} from './offlineStorage.js';

const TOKEN_KEY = AUTH_TOKEN || STORAGE_KEYS?.AUTH_TOKEN || '@skilltracker_token';
const USER_KEY = USER_DATA || STORAGE_KEYS?.USER_DATA || '@skilltracker_user';
const USER_ID_KEY = USER_ID || STORAGE_KEYS?.USER_ID || '@skilltracker_user_id';

/**
 * Register user
 * Mobile -> Express API -> MongoDB Atlas
 * When offline: saves to device local registered accounts so user can continue seamlessly.
 */
export const register = async (userData) => {
  try {
    const normalizedEmail = (userData.email || '').trim().toLowerCase();
    const rawPassword = userData.password;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!userData.name?.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!userData.phone?.trim()) {
      return { success: false, error: 'Please enter your phone number.' };
    }
    if (!rawPassword || rawPassword.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // 1. Attempt Online Registration with MongoDB Atlas backend
    const onlineRes = await apiPost('/api/auth/register', {
      name: userData.name.trim(),
      email: normalizedEmail,
      phone: userData.phone.trim(),
      password: rawPassword,
      confirmPassword: userData.confirmPassword || rawPassword,
      college: userData.college ? userData.college.trim() : '',
      department: userData.department ? userData.department.trim() : '',
      year: userData.year ? userData.year.trim() : '',
    });

    if (onlineRes.success && onlineRes.data?.token) {
      const { token, user } = onlineRes.data;
      await saveItem(TOKEN_KEY, token);
      await saveItem(USER_KEY, user);
      if (user?.id || user?._id) {
        await saveItem(USER_ID_KEY, user.id || user._id);
      }
      // Cache account locally for future offline logins
      await saveRegisteredAccount({
        name: user.name,
        email: normalizedEmail,
        password: rawPassword,
        phone: user.phone || userData.phone,
        college: user.college || userData.college,
        department: user.department || userData.department,
        year: user.year || userData.year,
        user,
        token,
      });

      return {
        success: true,
        data: { token, user },
        isOffline: false,
        message: onlineRes.data?.message || 'Account created successfully!',
      };
    }

    // If server specifically responded with an error (e.g. 400 "account already exists")
    if (!onlineRes.isNetworkError && onlineRes.status >= 400 && onlineRes.status < 500) {
      return {
        success: false,
        error: onlineRes.error || 'An account with this email already exists.',
      };
    }

    // 2. Server unreachable / Offline mode:
    // Check if account already exists locally
    const existingLocal = await findRegisteredAccount(normalizedEmail);
    if (existingLocal) {
      return {
        success: false,
        error: 'An account with this email already exists on this device.',
      };
    }

    // Save account locally so user can continue uninterrupted
    const offlineId = 'usr_' + Date.now();
    const offlineUser = {
      id: offlineId,
      _id: offlineId,
      name: userData.name.trim(),
      email: normalizedEmail,
      phone: userData.phone.trim(),
      college: userData.college ? userData.college.trim() : '',
      department: userData.department ? userData.department.trim() : '',
      year: userData.year ? userData.year.trim() : '',
      skillsCount: 0,
      streak: 1,
    };
    const offlineToken = 'jwt_offline_' + Date.now();

    await saveRegisteredAccount({
      name: offlineUser.name,
      email: normalizedEmail,
      password: rawPassword,
      phone: offlineUser.phone,
      college: offlineUser.college,
      department: offlineUser.department,
      year: offlineUser.year,
      user: offlineUser,
      token: offlineToken,
    });

    await seedDemoData();
    await saveItem(TOKEN_KEY, offlineToken);
    await saveItem(USER_KEY, offlineUser);
    await saveItem(USER_ID_KEY, offlineId);

    return {
      success: true,
      data: { token: offlineToken, user: offlineUser },
      isOffline: true,
      message: 'Account created offline! Will synchronize when connected to server.',
    };
  } catch (err) {
    console.error('[authService.register error]', err);
    return {
      success: false,
      error: err.message || 'Registration failed. Please try again.',
    };
  }
};

/**
 * Login user
 * Fast backend verification -> JWT secure storage -> Auth state update
 * Handles invalid credentials, network errors, timeouts, and local offline access.
 */
export const login = async (credentials) => {
  try {
    const normalizedEmail = (credentials.email || '').trim().toLowerCase();
    const enteredPassword = credentials.password;

    if (!normalizedEmail || !enteredPassword) {
      return {
        success: false,
        error: 'Please enter both email and password.',
      };
    }

    // 1. Try server login first (fast timeout)
    const onlineRes = await apiPost('/api/auth/login', {
      email: normalizedEmail,
      password: enteredPassword,
    });

    if (onlineRes.success && onlineRes.data?.token) {
      const { token, user } = onlineRes.data;
      await saveItem(TOKEN_KEY, token);
      await saveItem(USER_KEY, user);
      if (user?.id || user?._id) {
        await saveItem(USER_ID_KEY, user.id || user._id);
      }
      await saveRegisteredAccount({
        email: normalizedEmail,
        password: enteredPassword,
        user,
        token,
      });

      return {
        success: true,
        data: { token, user },
        isOffline: false,
        message: onlineRes.data?.message || 'Login successful',
      };
    }

    // If server responded specifically with 401 / 400 (Invalid credentials)
    if (!onlineRes.isNetworkError && onlineRes.status === 401) {
      return {
        success: false,
        error: onlineRes.error || 'Invalid email or password. Please verify credentials.',
      };
    }

    // 2. Offline / Server Unreachable: Check local device accounts
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
        if (user.id || user._id) {
          await saveItem(USER_ID_KEY, user.id || user._id);
        }

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

    // 3. Fallback for demo account if user typed demo credentials
    if (
      normalizedEmail === 'demo@skilltracker.app' ||
      normalizedEmail === 'thamil@skilltracker.app' ||
      normalizedEmail === 'student@college.edu'
    ) {
      const mockUser = {
        id: 'usr_demo_student',
        _id: 'usr_demo_student',
        name: 'Thamizh Selvan',
        email: normalizedEmail,
        college: 'College of Engineering & Technology',
        department: 'Computer Science & Engineering',
        year: '3rd Year',
        phone: '+91 9876543210',
      };
      const mockToken = 'jwt_offline_demo_active';

      await seedDemoData();
      await saveItem(TOKEN_KEY, mockToken);
      await saveItem(USER_KEY, mockUser);
      await saveItem(USER_ID_KEY, mockUser.id);

      return {
        success: true,
        data: { token: mockToken, user: mockUser },
        isOffline: true,
        message: 'Signed in in offline mode',
      };
    }

    // 4. Server unreachable and no local account found
    if (onlineRes.isNetworkError) {
      return {
        success: false,
        error: `${onlineRes.error}\nNo locally saved account found for this email on this device. Please create an account or check your server connection.`,
      };
    }

    return {
      success: false,
      error: onlineRes.error || 'Invalid email or password. Please verify credentials.',
    };
  } catch (err) {
    console.error('[authService.login error]', err);
    return {
      success: false,
      error: err.message || 'Login failed. Please try again.',
    };
  }
};

/**
 * Fetch current authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const cachedUser = await getItem(USER_KEY);
    const res = await apiGet('/api/auth/me');
    if (res.success && res.data?.user) {
      await saveItem(USER_KEY, res.data.user);
      return res.data.user;
    }
    return cachedUser;
  } catch (err) {
    console.warn('[getCurrentUser warn]', err);
    return await getItem(USER_KEY);
  }
};

/**
 * Update user profile
 * Works online and offline
 */
export const updateProfile = async (userData) => {
  try {
    // 1. Update local storage immediately for responsive UI
    const currentUser = (await getItem(USER_KEY)) || {};
    const updatedUser = { ...currentUser, ...userData };
    await saveItem(USER_KEY, updatedUser);

    if (updatedUser.email) {
      await updateRegisteredAccount(updatedUser.email, { user: updatedUser, ...userData });
    }

    // 2. Send to server
    const res = await apiPut('/api/auth/me', userData);
    if (res.success && res.data?.user) {
      await saveItem(USER_KEY, res.data.user);
      return { success: true, user: res.data.user };
    }

    return {
      success: true,
      user: updatedUser,
      isOffline: Boolean(res.isOffline),
      message: res.isOffline ? 'Profile updated locally.' : 'Profile updated.',
    };
  } catch (err) {
    console.error('[updateProfile error]', err);
    return { success: false, error: err.message || 'Failed to update profile' };
  }
};

/**
 * Logout
 */
export const logout = async () => {
  try {
    await removeItem(TOKEN_KEY);
    await removeItem(USER_KEY);
    await removeItem(USER_ID_KEY);
  } catch (err) {
    console.error('[logout error]', err);
  }
};

/**
 * Check initial authentication status
 */
export const checkAuthStatus = async () => {
  try {
    const token = await getItem(TOKEN_KEY);
    const user = await getItem(USER_KEY);
    return { isAuthenticated: Boolean(token), token, user };
  } catch (err) {
    console.error('[checkAuthStatus error]', err);
    return { isAuthenticated: false, token: null, user: null };
  }
};

/**
 * Change Password
 * PUT /api/auth/change-password
 */
export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  try {
    if (!currentPassword || !newPassword) {
      return { success: false, error: 'Current and new password are required' };
    }
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long' };
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return { success: false, error: 'New passwords do not match' };
    }
    if (currentPassword === newPassword) {
      return { success: false, error: 'New password cannot be the same as current password' };
    }

    const res = await apiPut('/api/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (res.success) {
      const currentUser = await getItem(USER_KEY);
      if (currentUser?.email) {
        await updateRegisteredAccount(currentUser.email, { password: newPassword });
      }
      return { success: true, message: res.data?.message || 'Password changed successfully' };
    }

    return { success: false, error: res.error || 'Failed to change password' };
  } catch (err) {
    console.error('[changePassword error]', err);
    return { success: false, error: err.message || 'Failed to change password' };
  }
};

export default {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  checkAuthStatus,
};
