import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';
import { authService } from '../services';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password?: string) => Promise<User>;
  register: (name: string, email: string, phone?: string) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<User>;
  setCurrentUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      login: async (email: string, password?: string) => {
        set({ isLoading: true });
        try {
          const res = await authService.login({ email, password });
          set({
            currentUser: res.user,
            isAuthenticated: true,
            token: res.token,
            isLoading: false,
          });
          return res.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name: string, email: string, phone?: string) => {
        set({ isLoading: true });
        try {
          const res = await authService.register({ name, email, phone });
          set({
            currentUser: res.user,
            isAuthenticated: true,
            token: res.token,
            isLoading: false,
          });
          return res.user;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        await authService.logout();
        set({ currentUser: null, isAuthenticated: false, token: null });
      },

      switchRole: async (role: UserRole) => {
        const user = await authService.switchRole(role);
        set({ currentUser: user, isAuthenticated: true });
        return user;
      },

      setCurrentUser: (user: User) => {
        set({ currentUser: user, isAuthenticated: true });
      },
    }),
    {
      name: 'nagarsam_auth_store',
    }
  )
);
