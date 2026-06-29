import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore, useEffectiveTheme, THEME_VARIABLES, type Theme } from "../store/theme";

const OPTIONS: { id: Theme; icon: string; label: string }[] = [
  { id: "light", icon: "sunny-outline", label: "Claro" },
  { id: "dark", icon: "moon-outline", label: "Oscuro" },
  { id: "system", icon: "phone-portrait-outline", label: "Sistema" },
];

export default function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const theme = useEffectiveTheme();
  const colors = THEME_VARIABLES[theme];

  return (
    <View className="flex-row bg-bg-surface rounded-2xl p-1">
      {OPTIONS.map((opt) => {
        const active = preference === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-xl ${active ? "bg-primary-300" : ""}`}
            onPress={() => setPreference(opt.id)}
          >
            <Ionicons
              name={opt.icon as any}
              size={16}
              color={active ? "#181818" : colors["--color-text-secondary"]}
            />
            <Text
              className={`ml-1.5 text-sm font-medium ${active ? "text-bg" : "text-text-secondary"}`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
