/**
 * Pantalla de inicio de sesión.
 * =============================
 *
 * Es la primera pantalla que ve el usuario si no está autenticado.
 *
 * Flujo:
 *   1. Usuario ingresa email + contraseña
 *   2. Toca "Entrar"
 *   3. Se llama a useAuthStore.login()
 *   4. Si OK → redirige a (tabs)
 *   5. Si error → muestra mensaje en rojo
 *
 * Diseño:
 *   - Fondo oscuro (slate-950) → típico de apps financieras
 *   - Inputs con estilo consistente (bg-slate-800, rounded-xl)
 *   - Botón principal indigo-500
 *   - Enlace a registro
 *
 * Teclado:
 *   - KeyboardAvoidingView asegura que los inputs no queden
 *     tapados por el teclado en iOS
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/auth";

export default function LoginScreen() {
  // ── Estado local del formulario ─────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  /**
   * Maneja el envío del formulario de login.
   *
   * Si el login es exitoso, el store de auth actualiza
   * isAuthenticated = true y el layout redirige automáticamente.
   */
  const handleLogin = async () => {
    try {
      setError("");
      await login(email, password);
      router.replace("/(tabs)");  // replace evita volver atrás con el botón
    } catch (err: any) {
      // El backend devuelve error en err.response.data.detail
      setError(err.response?.data?.detail || "Error al iniciar sesión");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950 justify-center px-6"
    >
      {/* ── Logo / Título ─────────────────────────────────── */}
      <View className="mb-12">
        <Text className="text-4xl font-bold text-white">Ariel</Text>
        <Text className="text-4xl font-bold text-indigo-400">Finance</Text>
        <Text className="text-slate-400 mt-2 text-lg">Controla tus finanzas</Text>
      </View>

      {/* ── Mensaje de error ──────────────────────────────── */}
      {error ? (
        <Text className="text-red-400 mb-4 text-center">{error}</Text>
      ) : null}

      {/* ── Inputs ─────────────────────────────────────────── */}
      <TextInput
        className="bg-slate-800 text-white p-4 rounded-xl mb-4"
        placeholder="Email"
        placeholderTextColor="#64748b"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        className="bg-slate-800 text-white p-4 rounded-xl mb-6"
        placeholder="Contraseña"
        placeholderTextColor="#64748b"
        secureTextEntry  // Oculta el texto
        value={password}
        onChangeText={setPassword}
      />

      {/* ── Botón de login ──────────────────────────────────── */}
      <TouchableOpacity
        className="bg-indigo-500 p-4 rounded-xl items-center active:bg-indigo-600"
        onPress={handleLogin}
      >
        <Text className="text-white font-semibold text-lg">Entrar</Text>
      </TouchableOpacity>

      {/* ── Enlace a registro ───────────────────────────────── */}
      <TouchableOpacity
        className="mt-4 items-center"
        onPress={() => router.push("/auth/register")}
      >
        <Text className="text-slate-400">
          ¿No tienes cuenta?{" "}
          <Text className="text-indigo-400 font-semibold">Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
