import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";

export default function TransactionsScreen() {
  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-4">
          <Text className="text-text-primary text-3xl font-bold">Movimientos</Text>
        </View>
        <Card className="mx-6 p-8 items-center">
          <Ionicons name="list-outline" size={48} color="#707070" />
          <Text className="text-text-muted mt-3 text-center">Aún no hay movimientos registrados</Text>
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}
