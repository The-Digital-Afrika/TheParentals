// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const getFriendlyApiError = (err, fallback = 'Network error. Please try again.') => {
  if (!err) return fallback;
  if (err.status === 0) {
    return 'Cannot reach the backend. Confirm the backend is running on port 5000, then refresh and try again.';
  }
  if (err.message === 'Failed to fetch') {
    return 'Cannot reach the backend. Confirm the backend is running on port 5000, then refresh and try again.';
  }
  return err.message || fallback;
};

const getStoredProviderForUser = (userData) => {
  try {
    const providers = JSON.parse(localStorage.getItem('sah_providers') || '[]');
    const id = userData?.id || userData?.userId || '';
    const email = String(userData?.email || '').toLowerCase();
    return providers.find(provider =>
      (id && (provider.id === id || provider.userId === id))
      || (email && String(provider.email || provider.contactEmail || provider.inquiryEmail || '').toLowerCase() === email)
    ) || null;
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('sah_user') || localStorage.getItem('sah_current_user');
        if (!storedUser) {
          setUser(null);
          return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('sah_user');
        localStorage.removeItem('sah_current_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncUserFromStorage();

    const handleAuthChange = () => syncUserFromStorage();
    const handleStorage = (event) => {
      if (!event.key || ['sah_user', 'sah_current_user', 'sah_token'].includes(event.key)) {
        syncUserFromStorage();
      }
    };

    window.addEventListener('sah-auth-change', handleAuthChange);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('sah-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      const role = (userData?.role || 'PROVIDER').toUpperCase();
      const data = await api.register({
        email:       (userData?.email || '').toLowerCase(),
        password:    userData?.password || '',
        role,
        name:        userData?.fullName || userData?.businessName || userData?.username || '',
        accountType: userData?.accountType || (role === 'USER' ? 'parent' : 'Individual Provider'),
      });

      const userSession = {
        ...data.user,
        token: data.token,
        plan:   data.user?.role === 'PROVIDER' ? 'free' : undefined,
        status: data.user?.role === 'PROVIDER' ? 'pending' : undefined,
      };

      setUser(userSession);
      localStorage.setItem('sah_user', JSON.stringify(userSession));
      localStorage.setItem('sah_current_user', JSON.stringify(userSession));
      localStorage.setItem('sah_token', data.token);

      return { success: true, user: userSession, message: data.message };

    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: err.status === 409 ? 'email_taken' : getFriendlyApiError(err) };
    }
  };

  const registerUser = (userData) => register({ ...userData, role: 'USER', accountType: 'parent' });

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  // Accepts either:
  //   login(userObject)       – called after registration with pre-built session
  //   login(email, password)  – called from Login page
  const login = async (emailOrUserObj, password) => {
    // Pre-built user object (e.g. called right after register)
    if (emailOrUserObj && typeof emailOrUserObj === 'object') {
      const userData = emailOrUserObj;
      setUser(userData);
      localStorage.setItem('sah_user', JSON.stringify(userData));
      localStorage.setItem('sah_current_user', JSON.stringify(userData));
      if (userData.token) localStorage.setItem('sah_token', userData.token);
      return;
    }

    const email = emailOrUserObj;
    try {
      const data = await api.login({
        email:    (email || '').trim().toLowerCase(),
        password,
      });

      const storedProvider = getStoredProviderForUser(data.user);
      const userData = {
        ...data.user,
        token: data.token,
        plan: data.user?.plan || storedProvider?.listingPlan || storedProvider?.plan || storedProvider?.tier,
        status: data.user?.status || storedProvider?.status,
        profilePhoto: storedProvider?.profilePhoto || storedProvider?.photo || storedProvider?.image,
      };
      setUser(userData);
      localStorage.setItem('sah_user', JSON.stringify(userData));
      localStorage.setItem('sah_current_user', JSON.stringify(userData));
      localStorage.setItem('sah_token', data.token);

      return { success: true, user: userData, message: data.message };

    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: getFriendlyApiError(err) };
    }
  };

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem('sah_user');
    localStorage.removeItem('sah_current_user');
    localStorage.removeItem('sah_token');
    window.dispatchEvent(new Event('sah-auth-change'));
  };

  // ── UPDATE PLAN ───────────────────────────────────────────────────────────
  const updateUserPlan = (plan) => {
    if (!user) return;
    try {
      const updatedUser = { ...user, plan };
      setUser(updatedUser);
      localStorage.setItem('sah_user', JSON.stringify(updatedUser));
      localStorage.setItem('sah_current_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating user plan:', error);
    }
  };

  const value = { user, loading, register, registerUser, login, logout, updateUserPlan };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
