import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/auth";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const handleRegister = async () => {
    try {
      setError("");
      await register(email, name, password);
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al registrarse");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950 justify-center px-6"
    >
      <View className="mb-12">
        <Text className="text-4xl font-bold text-white">Crear</Text>
        <Text className="text-4xl font-bold text-indigo-400">Cuenta</Text>
      </View>

      {error ? (
        <Text className="text-red-400 mb-4 text-center">{error}</Text>
      ) : null}

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
