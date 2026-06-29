import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffectiveTheme, THEME_VARIABLES } from "../../store/theme";

export default function TabsLayout() {
  const theme = useEffectiveTheme();
  const c = THEME_VARIABLES[theme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c["--color-bg-surface"],
          borderTopColor: c["--color-border"],
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarActiveTintColor: "#c0c0f8",
        tabBarInactiveTintColor: c["--color-text-muted"],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="transactions" options={{ title: "Movimientos", tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} /> }} />
      <Tabs.Screen name="add" options={{ title: "Añadir", tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" size={size} color={color} /> }} />
      <Tabs.Screen name="budgets" options={{ title: "Presupuestos", tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Perfil", tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
    </Tabs>
  );
}
