import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";

export default function BudgetsScreen() {
  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-4">
          <Text className="text-text-primary text-3xl font-bold">Presupuestos</Text>
        </View>
        <Card className="mx-6 p-8 items-center">
          <Ionicons name="wallet-outline" size={48} color="#707070" />
          <Text className="text-text-muted mt-3 text-center">No hay presupuestos aún</Text>
          <Button title="Crear presupuesto" onPress={() => {}} className="mt-4" />
        </Card>
      </ScrollView>
    </ScreenLayout>
  );
}
