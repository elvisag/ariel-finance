/**
 * Pantalla para añadir una nueva transacción.
 * ============================================
 *
 * Formulario para registrar un ingreso o un gasto.
 *
 * Campos:
 *   - Tipo: ingreso (verde) / gasto (rojo) — selector visual
 *   - Monto: input numérico con teclado decimal
 *   - Descripción: texto libre
 *
 * Pendiente de implementar:
 *   - Selector de cuenta (ahora usa la primera disponible)
 *   - Selector de categoría
 *   - Selector de fecha (ahora usa la fecha actual)
 *   - Conexión con el API
 *
 * UX:
 *   - El teclado numérico aparece automáticamente para el monto
 *   - Diseño limpio con focus en el monto (letra grande)
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
import { Ionicons } from "@expo/vector-icons";

// Opciones para el selector de tipo (ingreso/gasto)
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
    // TODO: Conectar con el API
    // const payload = {
    //   account_id: selectedAccount.id,
    //   amount: parseFloat(amount),
    //   type,
    //   description,
    //   transaction_date: new Date().toISOString().split("T")[0],
    // };
    // await transactionsApi.create(payload);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-slate-950"
    >
      {/* ── Header con botón cerrar ─────────────────────────── */}
      <View className="px-6 pt-16 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#94a3b8" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mt-4">
          Nuevo movimiento
        </Text>
      </View>

      <View className="px-6">
        {/* ── Selector de tipo (ingreso/gasto) ──────────────── */}
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

        {/* ── Monto ─────────────────────────────────────────── */}
        <Text className="text-slate-400 mb-2">Monto</Text>
        <TextInput
          className="bg-slate-800 text-white text-3xl font-bold p-4 rounded-xl mb-4"
          placeholder="$0.00"
          placeholderTextColor="#475569"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        {/* ── Descripción ────────────────────────────────────── */}
        <Text className="text-slate-400 mb-2">Descripción</Text>
        <TextInput
          className="bg-slate-800 text-white p-4 rounded-xl mb-6"
          placeholder="¿En qué gastaste?"
          placeholderTextColor="#475569"
          value={description}
          onChangeText={setDescription}
        />

        {/* ── Botón de guardar ──────────────────────────────── */}
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
