import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";

type TransactionType = "income" | "expense" | "transfer";

export default function AddScreen() {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    // TODO: Conectar con el API
    router.back();
  };

  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="close" size={24} color="#f8f8f8" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">Añadir movimiento</Text>
        </View>

        <View className="flex-row mx-6 mb-6 bg-bg-surface rounded-xl p-1">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              className={`flex-1 py-3 rounded-lg items-center ${type === t ? "bg-primary-300" : ""}`}
              onPress={() => setType(t)}
            >
              <Text className={`font-semibold ${type === t ? "text-bg" : "text-text-secondary"}`}>
                {t === "expense" ? "Gasto" : t === "income" ? "Ingreso" : "Transferencia"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Card className="mx-6 mb-6">
          <Input
            placeholder="$ 0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Input
            placeholder="Descripción (opcional)"
            value={description}
            onChangeText={setDescription}
          />
        </Card>

        <Card className="mx-6 mb-6">
          <Text className="text-text-secondary text-sm mb-3">Cuenta</Text>
          <TouchableOpacity className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="wallet-outline" size={20} color="#a0a0a0" />
              <Text className="text-text-primary ml-3">Seleccionar cuenta</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#707070" />
          </TouchableOpacity>

          <Text className="text-text-secondary text-sm mb-3 mt-4">Categoría</Text>
          <TouchableOpacity className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="pricetag-outline" size={20} color="#a0a0a0" />
              <Text className="text-text-primary ml-3">Seleccionar categoría</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#707070" />
          </TouchableOpacity>
        </Card>

        <View className="px-6 mb-8">
          <Button title="Guardar" onPress={handleSubmit} size="lg" />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}
