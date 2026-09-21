import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuthStatus, login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '../services/authService';
import { getItem, saveItem, seedDemoData, STORAGE_KEYS } from '../services/offlineStorage';
import { Colors } from '../constants/colors';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [themeMode, setThemeMode] = useState('dark');

  useEffect(() => {
    loadInitialState();
  }, []);

  const loadInitialState = async () => {
    try {
      const savedTheme = await getItem(STORAGE_KEYS.THEME_MODE);
      if (savedTheme) {
        setThemeMode(savedTheme);
      }

      const auth = await checkAuthStatus();
      if (auth.isAuthenticated) {
        setToken(auth.token);
        setUser(auth.user);
        // refresh in background
        getCurrentUser().then((fresh) => {
          if (fresh) setUser(fresh);
        });
      }
    } catch (e) {
      console.warn('Initial auth load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newTheme);
    await saveItem(STORAGE_KEYS.THEME_MODE, newTheme);
  };

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const demoLogin = async () => {
    const mockUser = {
      id: 'demo_user_101',
      name: 'Thamil Selvan',
      email: 'thamil@skilltracker.app',
      college: 'College of Engineering & Technology',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      skillsCount: 5,
      streak: 7,
      isDemo: true,
    };
    const mockToken = 'demo_jwt_offline_active';
    await seedDemoData();
    await saveItem(STORAGE_KEYS.AUTH_TOKEN, mockToken);
    await saveItem(STORAGE_KEYS.USER_DATA, mockUser);
    setToken(mockToken);
    setUser(mockUser);
    return { success: true, data: { user: mockUser, token: mockToken } };
  };

  const register = async (userData) => {
    const res = await apiRegister(userData);
    if (res.success && res.data) {
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const logout = async () => {
    await apiLogout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const fresh = await getCurrentUser();
    if (fresh) setUser(fresh);
    return fresh;
  };

  const activeColors = themeMode === 'dark' ? Colors.dark : Colors.light;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
        themeMode,
        toggleTheme,
        colors: activeColors,
        theme: {
          ...activeColors,
          primary: Colors.primary,
          secondary: Colors.secondary,
          accent: Colors.accent,
          success: Colors.success,
          warning: Colors.warning,
          danger: Colors.danger,
          info: Colors.info,
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default useAuth;
