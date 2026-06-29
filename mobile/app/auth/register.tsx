import { useState, useEffect } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import Button from "../../components/Button";
import Input from "../../components/Input";
import ScreenLayout from "../../components/ScreenLayout";
import ErrorMessage from "../../components/ErrorMessage";

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
    <ScreenLayout safeArea={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="mb-10">
          <Text className="text-4xl font-bold text-text-primary">Crear</Text>
          <Text className="text-4xl font-bold text-primary-300">Cuenta</Text>
        </View>

        <ErrorMessage message={displayError} className="mb-4" />

        <Button
          title="Registrarse con Google"
          onPress={signInWithGoogle}
          variant="secondary"
          icon="logo-google"
          disabled={!googleReady || googleLoading}
          loading={googleLoading}
          className="mb-6"
        />

        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-text-muted mx-4">o con email</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <Input
          placeholder="Nombre completo"
          value={name}
          onChangeText={setName}
        />

        <Input
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title="Crear cuenta" onPress={handleRegister} size="lg" className="mb-4" />

        <Button
          title="¿Ya tienes cuenta? Inicia sesión"
          onPress={() => router.back()}
          variant="ghost"
        />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
