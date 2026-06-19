import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-slate-950">
      <View className="px-6 pt-16 pb-8">
        <Text className="text-slate-400 text-lg">Hola,</Text>
        <Text className="text-white text-3xl font-bold">{user?.name || "Usuario"}</Text>
      </View>

      <View className="bg-gradient-to-r from-indigo-500 to-purple-600 mx-6 p-6 rounded-3xl">
        <Text className="text-white/70 text-sm">Balance total</Text>
        <Text className="text-white text-4xl font-bold mt-1">$0.00</Text>
        <View className="flex-row mt-4 gap-4">
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-400 mr-2" />
            <Text className="text-white/80">Ingresos: $0</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-red-400 mr-2" />
            <Text className="text-white/80">Gastos: $0</Text>
          </View>
        </View>
      </View>

      <View className="flex-row mx-6 mt-6 gap-4">
        <TouchableOpacity
          className="flex-1 bg-slate-800 p-4 rounded-2xl items-center"
          onPress={() => router.push("/(tabs)/add")}
        >
          <Ionicons name="trending-up" size={24} color="#10b981" />
          <Text className="text-white mt-2 font-semibold">Ingreso</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-slate-800 p-4 rounded-2xl items-center"
          onPress={() => router.push("/(tabs)/add")}
        >
          <Ionicons name="trending-down" size={24} color="#ef4444" />
          <Text className="text-white mt-2 font-semibold">Gasto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-slate-800 p-4 rounded-2xl items-center"
          onPress={() => router.push("/(tabs)/transactions")}
        >
          <Ionicons name="swap-horizontal" size={24} color="#6366f1" />
          <Text className="text-white mt-2 font-semibold">Ver todo</Text>
        </TouchableOpacity>
      </View>

      <View className="mx-6 mt-8">
        <Text className="text-white text-xl font-bold mb-4">Últimos movimientos</Text>
        <View className="bg-slate-800/50 rounded-2xl p-8 items-center">
          <Ionicons name="receipt-outline" size={48} color="#475569" />
          <Text className="text-slate-500 mt-3">No hay movimientos aún</Text>
          <TouchableOpacity
            className="mt-4 bg-indigo-500 px-6 py-3 rounded-xl"
            onPress={() => router.push("/(tabs)/add")}
          >
            <Text className="text-white font-semibold">Añadir primero</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
