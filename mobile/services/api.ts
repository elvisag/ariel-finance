/**
 * Configuración del cliente HTTP (Axios) para comunicarse con el backend.
 * =======================================================================
 *
 * Responsabilidades:
 *   1. Crear una instancia de Axios con la URL base del backend
 *   2. Interceptor de request → agregar token JWT al header Authorization
 *   3. Interceptor de response → si 401, limpiar token (sesión expirada)
 *
 * El token se almacena en SecureStore (almacenamiento cifrado del dispositivo),
 * NO en AsyncStorage (que no es seguro para datos sensibles).
 *
 * Variables de entorno:
 *   EXPO_PUBLIC_API_URL — URL del backend (ej: http://192.168.1.100:8000/api/v1)
 *   Si no está definida, usa un fallback para desarrollo local.
 */

import axios from "axios";
import * as SecureStore from "expo-secure-store";

// Clave usada para guardar/leer el token en SecureStore
const TOKEN_KEY = "auth_token";

/**
 * Instancia de Axios preconfigurada.
 *
 * Características:
 *   - baseURL: apunta al backend (configurable via EXPO_PUBLIC_API_URL)
 *   - Content-Type: siempre JSON
 *   - Timeout: 30 segundos por defecto (lo maneja Axios internamente)
 */
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://192.168.0.1:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

/**
 * Interceptor de REQUEST.
 *
 * Se ejecuta ANTES de enviar cada petición al backend.
 * Lee el token de SecureStore y lo agrega como:
 *   Authorization: Bearer <token>
 *
 * Si no hay token, la petición se envía sin header (útil para login/register).
 */
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Interceptor de RESPONSE.
 *
 * Se ejecuta DESPUÉS de recibir cada respuesta del backend.
 * Si el backend responde con 401 (Unauthorized), significa que
 * el token expiró o es inválido → lo borramos del SecureStore.
 *
 * El store de auth detectará que no hay token y redirigirá al login.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

// ── Funciones de manejo de token ──────────────────────────────
// Se exportan para que el store de autenticación pueda usarlas.

/** Guarda el token en el almacenamiento seguro del dispositivo. */
export async function setToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/** Lee el token del almacenamiento seguro. */
export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** Elimina el token (cierre de sesión). */
export async function removeToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export default api;
