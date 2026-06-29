import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-8">
          <Text className="text-text-secondary text-lg">Hola,</Text>
          <Text className="text-text-primary text-3xl font-bold">{user?.name || "Usuario"}</Text>
        </View>

        <View className="mx-6 p-6 rounded-3xl bg-primary-300">
          <Text className="text-bg/70 text-sm">Balance total</Text>
          <Text className="text-bg text-4xl font-bold mt-1">$0.00</Text>
          <View className="flex-row mt-4 gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-finance-income mr-2" />
              <Text className="text-bg/80">Ingresos: $0</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-finance-expense mr-2" />
              <Text className="text-bg/80">Gastos: $0</Text>
            </View>
          </View>
        </View>

        <View className="flex-row mx-6 mt-6 gap-4">
          <TouchableOpacity
            className="flex-1 bg-bg-surface p-4 rounded-2xl items-center"
            onPress={() => router.push("/(tabs)/add")}
          >
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <Text className="text-text-primary mt-2 font-semibold">Ingreso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-bg-surface p-4 rounded-2xl items-center"
            onPress={() => router.push("/(tabs)/add")}
          >
            <Ionicons name="trending-down" size={24} color="#ef4444" />
            <Text className="text-text-primary mt-2 font-semibold">Gasto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-bg-surface p-4 rounded-2xl items-center"
            onPress={() => router.push("/(tabs)/transactions")}
          >
            <Ionicons name="swap-horizontal" size={24} color="#c0c0f8" />
            <Text className="text-text-primary mt-2 font-semibold">Ver todo</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-6 mt-8 mb-8">
          <Text className="text-text-primary text-xl font-bold mb-4">Últimos movimientos</Text>
          <Card className="p-8 items-center">
            <Ionicons name="receipt-outline" size={48} color="#707070" />
            <Text className="text-text-muted mt-3">No hay movimientos aún</Text>
            <Button
              title="Añadir primero"
              onPress={() => router.push("/(tabs)/add")}
              className="mt-4"
            />
          </Card>
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
