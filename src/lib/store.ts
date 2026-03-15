import { create } from 'zustand';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'org_admin' | 'issuer';
  organization_id: string | null;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Initially true while we check local storage
  login: (accessToken, refreshToken, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
    }
    set({ user, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
  setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
