import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  return (
    <View className="flex-1 bg-slate-950">
      <View className="px-6 pt-16 pb-4">
        <Text className="text-white text-3xl font-bold">Perfil</Text>
      </View>

      <View className="items-center mt-8 mb-8">
        <View className="w-24 h-24 bg-indigo-500/20 rounded-full items-center justify-center">
          <Ionicons name="person" size={48} color="#6366f1" />
        </View>
        <Text className="text-white text-xl font-bold mt-4">{user?.name}</Text>
        <Text className="text-slate-400">{user?.email}</Text>
      </View>

      <View className="mx-6 bg-slate-800/50 rounded-2xl">
        <TouchableOpacity className="p-4 flex-row items-center">
          <Ionicons name="settings-outline" size={22} color="#94a3b8" />
          <Text className="text-white ml-3">Configuración</Text>
        </TouchableOpacity>
        <View className="h-px bg-slate-700 mx-4" />
        <TouchableOpacity className="p-4 flex-row items-center" onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text className="text-red-400 ml-3">Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
