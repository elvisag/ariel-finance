/**
 * Layout raíz de la aplicación.
 * =============================
 *
 * Configura los proveedores globales:
 *   - SafeAreaProvider: maneja el área segura (notch, barra de estado)
 *   - QueryClientProvider: React Query para cachear llamadas API
 *   - Stack Navigator: navegación entre auth y tabs
 *
 * El flujo de pantallas es:
 *   Root → Auth (login/register) → Tabs (inicio/movimientos/añadir/presupuestos/perfil)
 *
 * La redirección inicial se maneja en app/index.tsx.
 * La autenticación se verifica con checkAuth() en el primer render.
 *
 * NativeWind: el import de "../global.css" es necesario para que
 * Tailwind funcione. Sin esto, las clases className no se aplican.
 */

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../store/auth";
import "../global.css";

/**
 * Cliente de React Query.
 *
 * Configuración global:
 *   - staleTime: 5 minutos (los datos no se recargan si se pidieron hace < 5 min)
 *   - retry: 1 (reintenta una vez si falla)
 *
 * Se puede sobreescribir por query:
 *   useQuery({ queryKey: ["accounts"], queryFn: ..., staleTime: 1000 * 60 })
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutos
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {/*
          Stack Navigator:
            - headerShown: false → cada pantalla maneja su propio header
            - auth: pantallas de login/registro (sin tabs)
            - (tabs): pantallas principales con navegación por tabs
        */}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="accounts" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
