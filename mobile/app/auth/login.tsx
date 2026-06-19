/**
 * Pantalla de inicio de sesión.
 * =============================
 *
 * Dos formas de entrar:
 *   1. Email + contraseña (registro tradicional)
 *   2. Google OAuth (con expo-auth-session)
 *
 * Flujo:
 *   1. Usuario elige cómo autenticarse
 *   2. Si OK → redirige a (tabs)
 *   3. Si error → muestra mensaje en rojo
 */

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const {
    signInWithGoogle,
    isLoading: googleLoading,
    error: googleError,
    isReady: googleReady,
  } = useGoogleAuth();

  const handleLogin = async () => {
    try {
      setError("");
      await login(email, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al iniciar sesión");
    }
  };

  const displayError = error || googleError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950 justify-center px-6"
    >
      {/* ── Logo ────────────────────────────────────────────── */}
      <View className="mb-10">
        <Text className="text-4xl font-bold text-white">Ariel</Text>
        <Text className="text-4xl font-bold text-indigo-400">Finance</Text>
        <Text className="text-slate-400 mt-2 text-lg">Controla tus finanzas</Text>
      </View>

      {/* ── Error ───────────────────────────────────────────── */}
      {displayError ? (
        <Text className="text-red-400 mb-4 text-center">{displayError}</Text>
      ) : null}

      {/* ── Botón Google ────────────────────────────────────── */}
      <TouchableOpacity
        className="bg-white p-4 rounded-xl items-center flex-row justify-center mb-6"
        onPress={signInWithGoogle}
        disabled={!googleReady || googleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#000" />
            <Text className="text-black font-semibold ml-2">
              Continuar con Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ── Divisor ─────────────────────────────────────────── */}
      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-slate-700" />
        <Text className="text-slate-500 mx-4">o con email</Text>
        <View className="flex-1 h-px bg-slate-700" />
      </View>

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
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="bg-indigo-500 p-4 rounded-xl items-center active:bg-indigo-600"
        onPress={handleLogin}
      >
        <Text className="text-white font-semibold text-lg">Entrar</Text>
      </TouchableOpacity>

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
