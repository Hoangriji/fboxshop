import { create } from 'zustand';
import { AdminAuthService } from '../services/firebaseService';
import { SESSION_KEY, SESSION_DURATION } from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: true,

  checkSession: () => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      try {
        const sessionData = JSON.parse(session);
        const now = new Date().getTime();
        
        if (sessionData.expires > now) {
          set({ isAuthenticated: true, isLoading: false });
          return;
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    set({ isAuthenticated: false, isLoading: false });
  },

  login: async (username: string, password: string) => {
    try {
      set({ isLoading: true });
      
      const isValid = await AdminAuthService.validateCredentials(username, password);
      
      if (isValid) {
        await AdminAuthService.updateLastLogin();
        
        const sessionData = {
          username,
          loginTime: new Date().getTime(),
          expires: new Date().getTime() + SESSION_DURATION
        };
        
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
        set({ isAuthenticated: true, isLoading: false });
        return true;
      }
      
      set({ isLoading: false });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    set({ isAuthenticated: false });
  }
}));
