import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    try {
      setError("");
      await login(email, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al iniciar sesión");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950 justify-center px-6"
    >
      <View className="mb-12">
        <Text className="text-4xl font-bold text-white">Ariel</Text>
        <Text className="text-4xl font-bold text-indigo-400">Finance</Text>
        <Text className="text-slate-400 mt-2 text-lg">Controla tus finanzas</Text>
      </View>

      {error ? (
        <Text className="text-red-400 mb-4 text-center">{error}</Text>
      ) : null}

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
        onPress={handleLogin}
      >
        <Text className="text-white font-semibold text-lg">Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity className="mt-4 items-center" onPress={() => router.push("/auth/register")}>
        <Text className="text-slate-400">
          ¿No tienes cuenta?{" "}
          <Text className="text-indigo-400 font-semibold">Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
