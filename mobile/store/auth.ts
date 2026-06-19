/**
 * Store de autenticación (Zustand).
 * =================================
 *
 * Maneja el estado global de autenticación del usuario.
 * No usa React Context porque Zustand es más simple y evita
 * el "prop drilling" y re-renders innecesarios.
 *
 * Flujo de autenticación:
 *   1. App inicia → checkAuth() verifica si hay token guardado
 *   2. Si hay token válido → isAuthenticated = true, carga el usuario
 *   3. Si no hay token o expiró → isAuthenticated = false, redirige a login
 *   4. login() / register() → guardan token + cargan usuario
 *   5. logout() → borra token + limpia estado
 *
 * Cómo usar en un componente:
 *   const { user, isAuthenticated, logout } = useAuthStore();
 */

import { create } from "zustand";
import { authApi } from "../services/finance";
import { setToken, getToken, removeToken } from "../services/api";
import type { User } from "../services/finance";

interface AuthState {
  // ── Estado ─────────────────────────────────────────────────
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;  // True mientras se verifica el token al iniciar la app

  // ── Acciones ────────────────────────────────────────────────
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,  // Empieza en true hasta que checkAuth() termine

  /**
   * Inicia sesión con email y contraseña.
   *
   * Flujo:
   *   1. POST /auth/login → recibe JWT
   *   2. Guarda el JWT en SecureStore
   *   3. Obtiene los datos del usuario con GET /users/me
   *   4. Actualiza el estado (user + isAuthenticated)
   */
  login: async (email, password) => {
    const { data } = await authApi.login({ email, password });
    await setToken(data.access_token);                // Persistir token
    const me = await authApi.me();                     // Obtener perfil
    set({ user: me.data, isAuthenticated: true });     // Actualizar estado
  },

  /**
   * Registra un nuevo usuario.
   *
   * Mismo flujo que login pero primero crea la cuenta.
   */
  register: async (email, name, password) => {
    const { data } = await authApi.register({ email, name, password });
    await setToken(data.access_token);
    const me = await authApi.me();
    set({ user: me.data, isAuthenticated: true });
  },

  /**
   * Cierra la sesión del usuario.
   *
   * 1. Borra el token de SecureStore
   * 2. Limpia el estado (user = null, isAuthenticated = false)
   *
   * El componente de layout detecta isAuthenticated = false
   * y redirige automáticamente a la pantalla de login.
   */
  logout: async () => {
    await removeToken();
    set({ user: null, isAuthenticated: false });
  },

  /**
   * Verifica si hay una sesión activa al iniciar la app.
   *
   * Se llama desde el layout principal (app/_layout.tsx).
   *
   * Casos:
   *   - Hay token AND es válido → carga el usuario, autenticado
   *   - Hay token AND expiró → limpia token, no autenticado
   *   - No hay token → no autenticado
   *
   * En todos los casos, isLoading = false al finalizar.
   */
  checkAuth: async () => {
    try {
      // Intentar leer el token guardado
      const token = await getToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // El token existe, verificar que sea válido obteniendo el perfil
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      // Token inválido o expirado → limpiar y mostrar login
      await removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
