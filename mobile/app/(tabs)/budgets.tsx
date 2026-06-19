import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function BudgetsScreen() {
  return (
    <View className="flex-1 bg-slate-950">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-white text-3xl font-bold">Presupuestos</Text>
      </View>

      <ScrollView className="flex-1 px-6">
        <View className="bg-slate-800/50 rounded-2xl p-8 items-center mt-4">
          <Ionicons name="wallet-outline" size={48} color="#475569" />
          <Text className="text-slate-500 mt-3 text-center">
            No tienes presupuestos creados.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
