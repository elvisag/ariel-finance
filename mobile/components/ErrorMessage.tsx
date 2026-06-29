import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorMessageProps {
  message: string | null | undefined;
  className?: string;
}

export default function ErrorMessage({ message, className = "" }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <View className={`bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex-row items-center ${className}`}>
      <Ionicons name="alert-circle" size={18} color="#ef4444" />
      <Text className="text-red-400 ml-2 flex-1 text-sm">{message}</Text>
    </View>
  );
}
