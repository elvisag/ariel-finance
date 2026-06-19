import { create } from "zustand";
import { authApi } from "../services/finance";
import { setToken, getToken, removeToken } from "../services/api";
import type { User } from "../services/finance";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    await setToken(data.access_token);
    const me = await authApi.me();
    set({ user: me.data, isAuthenticated: true });
  },

  register: async (email, name, password) => {
    const { data } = await authApi.register({ email, name, password });
    await setToken(data.access_token);
    const me = await authApi.me();
    set({ user: me.data, isAuthenticated: true });
  },

  logout: async () => {
    await removeToken();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = await getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      await removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
