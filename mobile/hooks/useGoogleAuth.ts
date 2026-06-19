/**
 * Hook para autenticación con Google usando expo-auth-session.
 * =============================================================
 *
 * ¿Cómo funciona?
 *   1. El usuario toca "Continuar con Google"
 *   2. Se abre el navegador del sistema para que elija su cuenta Google
 *   3. Google redirige de vuelta a la app con un id_token (JWT)
 *   4. El hook envía el id_token a nuestro backend (POST /auth/google)
 *   5. El backend verifica el token con Google y devuelve nuestro JWT
 *   6. Guardamos nuestro JWT en SecureStore (igual que login normal)
 *
 * Configuración en Google Cloud Console:
 *   https://console.cloud.google.com
 *   - Crear proyecto
 *   - APIs & Services → Credentials
 *   - Crear OAuth 2.0 Client IDs para iOS, Android y Web
 *
 * Variables de entorno (.env):
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 */

import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "../store/auth";
import { setToken } from "../services/api";
import { authApi } from "../services/finance";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  /**
   * Procesa la respuesta de Google cuando el usuario vuelve a la app.
   *
   * Si el usuario autorizó:
   *   1. Extraemos el id_token del response de Google
   *   2. Lo enviamos a nuestro backend (POST /auth/google)
   *   3. El backend verifica y nos devuelve nuestro propio JWT
   *   4. Guardamos nuestro JWT en SecureStore
   *   5. checkAuth() carga el perfil del usuario desde el backend
   */
  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;

      if (id_token) {
        setIsLoading(true);
        setError(null);

        authApi
          .googleAuth(id_token)
          .then(async (res) => {
            // Guardar nuestro JWT en SecureStore
            await setToken(res.data.access_token);
            // Cargar el perfil del usuario desde el backend
            await checkAuth();
          })
          .catch((err) => {
            setError(err.response?.data?.detail || "Error al autenticar con Google");
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else if (response?.type === "error") {
      setError("Autenticación cancelada o fallida");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await promptAsync();
    } catch {
      setError("No se pudo abrir el navegador de Google");
    }
  };

  return {
    signInWithGoogle,
    isLoading,
    error,
    isReady: !!request,
  };
}
