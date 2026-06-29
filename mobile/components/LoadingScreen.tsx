import { View, ActivityIndicator, Text } from "react-native";

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View className="flex-1 bg-bg items-center justify-center">
      <ActivityIndicator size="large" color="#c0c0f8" />
      {message && (
        <Text className="text-text-secondary mt-4 text-base">{message}</Text>
      )}
    </View>
  );
}
