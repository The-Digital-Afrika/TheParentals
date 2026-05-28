// frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();
const API_URL = 'https://sahomeschooling-services-4.onrender.com';

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
    try {
      const storedUser = localStorage.getItem('sah_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (e) {
      localStorage.removeItem('sah_user');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:       (userData?.email || '').toLowerCase(),
          password:    userData?.password || '',
          role:        'PROVIDER',
          name:        userData?.fullName || userData?.businessName || '',
          accountType: userData?.accountType || 'Individual Provider',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || 'Registration failed.' };
      }

      const userSession = {
        ...data.user,
        token: data.token,
        plan:   'free',
        status: 'pending',
      };

      setUser(userSession);
      localStorage.setItem('sah_user', JSON.stringify(userSession));
      localStorage.setItem('sah_current_user', JSON.stringify(userSession));

      return { success: true, user: userSession, message: data.message };

    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

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
      return;
    }

    const email = emailOrUserObj;
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    (email || '').trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.message || 'Invalid email or password.' };
      }

      const userData = { ...data.user, token: data.token };
      setUser(userData);
      localStorage.setItem('sah_user', JSON.stringify(userData));
      localStorage.setItem('sah_current_user', JSON.stringify(userData));

      return { success: true, user: userData, message: data.message };

    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // ── LOGOUT ────────────────────────────────────────────────────────────────
  const logout = () => {
    setUser(null);
    localStorage.removeItem('sah_user');
    localStorage.removeItem('sah_current_user');
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

  const value = { user, loading, register, login, logout, updateUserPlan };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};