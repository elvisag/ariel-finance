import { View, Text, TextInput, type TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-text-secondary text-sm mb-2 ml-1">{label}</Text>
      )}
      <TextInput
        className={`bg-bg-surface text-text-primary p-4 rounded-xl border ${error ? "border-red-500" : "border-border"} ${className}`}
        placeholderTextColor="#707070"
        {...props}
      />
      {error && (
        <Text className="text-red-400 text-sm mt-1 ml-1">{error}</Text>
      )}
    </View>
  );
}
