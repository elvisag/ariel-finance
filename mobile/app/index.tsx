import { View, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "../store/auth";

export default function Index() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}
