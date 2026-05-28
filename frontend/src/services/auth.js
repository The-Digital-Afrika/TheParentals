import { api } from './api';

export const auth = {
  login: async (email, password) => {
    // In a real app, this would call a real authentication endpoint
    await api.delay?.(500);
    
    if (email === 'admin@sahomeschooling.co.za' && password === 'admin123') {
      return {
        success: true,
        data: {
          user: {
            id: 'admin1',
            email,
            name: 'Admin User',
            role: 'admin'
          },
          token: 'mock-jwt-token-admin'
        }
      };
    } else if (email === 'contact@khanacademy.org.za' && password.length >= 8) {
      return {
        success: true,
        data: {
          user: {
            id: 'khan',
            email,
            name: 'Khan Academy SA',
            role: 'client',
            plan: 'free',
            status: 'pending'
          },
          token: 'mock-jwt-token-client'
        }
      };
    } else if (password.length >= 8) {
      // Allow any email with 8+ char password for demo
      return {
        success: true,
        data: {
          user: {
            id: 'client-' + Date.now(),
            email,
            name: email.split('@')[0],
            role: 'client',
            plan: 'free',
            status: 'pending'
          },
          token: 'mock-jwt-token-client'
        }
      };
    }
    
    return {
      success: false,
      error: 'Invalid credentials'
    };
  },
  
  register: async (userData) => {
    await api.delay?.(700);
    
    // Mock registration - always succeeds for demo
    return {
      success: true,
      data: {
        user: {
          id: 'user-' + Date.now(),
          email: userData.email,
          name: userData.name,
          role: 'client',
          plan: 'free',
          status: 'pending'
        },
        token: 'mock-jwt-token-new'
      }
    };
  },
  
  logout: () => {
    localStorage.removeItem('sah_user');
    localStorage.removeItem('sah_token');
    return { success: true };
  }
};