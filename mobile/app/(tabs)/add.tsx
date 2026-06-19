import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TYPES = [
  { key: "income", label: "Ingreso", icon: "trending-up", color: "#10b981" },
  { key: "expense", label: "Gasto", icon: "trending-down", color: "#ef4444" },
];

export default function AddTransactionScreen() {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    // TODO: connect to API
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950"
    >
      <View className="px-6 pt-16 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mt-4">Nuevo movimiento</Text>
      </View>

      <View className="px-6">
        <View className="flex-row gap-3 mb-6">
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              className={`flex-1 p-4 rounded-2xl items-center ${
                type === t.key ? "bg-slate-700" : "bg-slate-800/50"
              }`}
              onPress={() => setType(t.key as "income" | "expense")}
            >
              <Ionicons name={t.icon as any} size={24} color={t.color} />
              <Text className="text-white mt-1">{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text className="text-slate-400 mb-2">Monto</Text>
        <TextInput
          className="bg-slate-800 text-white text-3xl font-bold p-4 rounded-xl mb-4"
          placeholder="$0.00"
          placeholderTextColor="#475569"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <Text className="text-slate-400 mb-2">Descripción</Text>
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl mb-6"
          placeholder="¿En qué gastaste?"
          placeholderTextColor="#475569"
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          className="bg-indigo-500 p-4 rounded-xl items-center mt-4"
          onPress={handleSubmit}
        >
          <Text className="text-white font-semibold text-lg">Guardar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
