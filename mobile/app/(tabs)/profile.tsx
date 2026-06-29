import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-4">
          <Text className="text-text-primary text-3xl font-bold">Perfil</Text>
        </View>

        <View className="items-center mt-8 mb-8">
          <View className="w-24 h-24 bg-primary-300/20 rounded-full items-center justify-center">
            <Ionicons name="person" size={48} color="#c0c0f8" />
          </View>
          <Text className="text-text-primary text-xl font-bold mt-4">{user?.name}</Text>
          <Text className="text-text-secondary">{user?.email}</Text>
        </View>

        <Card className="mx-6">
          <TouchableOpacity className="flex-row items-center py-3" onPress={() => router.push("/accounts")}>
            <Ionicons name="wallet-outline" size={22} color="#c0c0f8" />
            <Text className="text-text-primary ml-3">Mis cuentas</Text>
          </TouchableOpacity>
          <View className="h-px bg-border my-1" />
          <TouchableOpacity className="flex-row items-center py-3" onPress={() => router.push("/categories")}>
            <Ionicons name="pricetags-outline" size={22} color="#c0c0f8" />
            <Text className="text-text-primary ml-3">Categorías</Text>
          </TouchableOpacity>
          <View className="h-px bg-border my-1" />
          <TouchableOpacity className="flex-row items-center py-3">
            <Ionicons name="settings-outline" size={22} color="#a0a0a0" />
            <Text className="text-text-primary ml-3">Configuración</Text>
          </TouchableOpacity>
          <View className="h-px bg-border my-1" />
          <TouchableOpacity className="flex-row items-center py-3" onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text className="text-red-400 ml-3">Cerrar sesión</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}
