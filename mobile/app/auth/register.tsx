/**
 * Pantalla de registro.
 * =====================
 *
 * Dos formas de registrarse:
 *   1. Google OAuth (recomendado, más rápido)
 *   2. Email + contraseña + nombre
 *
 * Al registrarse con Google, se crea un usuario sin contraseña
 * en el backend (solo con google_id). Luego puede iniciar sesión
 * siempre con Google, nunca con email/contraseña.
 */

import { useState, useEffect } from "react";
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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated]);

  const {
    signInWithGoogle,
    isLoading: googleLoading,
    error: googleError,
    isReady: googleReady,
  } = useGoogleAuth();

  const handleRegister = async () => {
    try {
      setError("");
      await register(email, name, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al registrarse");
    }
  };

  const displayError = error || googleError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950 justify-center px-6"
    >
      <View className="mb-10">
        <Text className="text-4xl font-bold text-white">Crear</Text>
        <Text className="text-4xl font-bold text-indigo-400">Cuenta</Text>
      </View>

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
              Registrarse con Google
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View className="flex-row items-center mb-6">
        <View className="flex-1 h-px bg-slate-700" />
        <Text className="text-slate-500 mx-4">o con email</Text>
        <View className="flex-1 h-px bg-slate-700" />
      </View>

      {/* ── Formulario tradicional ──────────────────────────── */}
      <TextInput
        className="bg-slate-800 text-white p-4 rounded-xl mb-4"
        placeholder="Nombre completo"
        placeholderTextColor="#64748b"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        className="bg-slate-800 text-white p-4 rounded-xl mb-4"
        placeholder="Email"
        placeholderTextColor="#64748b"
        keyboardType="email-address"
        autoCapitalize="none"
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
        className="bg-indigo-500 p-4 rounded-xl items-center"
        onPress={handleRegister}
      >
        <Text className="text-white font-semibold text-lg">Crear cuenta</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
        <Text className="text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Text className="text-indigo-400 font-semibold">Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
