import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import PickerModal, { type PickerOption } from "../../components/PickerModal";
import { useAccounts, useCreateAccount, useUpdateAccount } from "../../hooks/useAccounts";

const ACCOUNT_TYPES: PickerOption[] = [
  { id: "checking", label: "Cuenta corriente", icon: "card-outline" },
  { id: "savings", label: "Caja de ahorro", icon: "piggy-bank-outline" },
  { id: "credit", label: "Tarjeta de crédito", icon: "card-outline" },
  { id: "investment", label: "Inversiones", icon: "trending-up-outline" },
  { id: "cash", label: "Efectivo", icon: "cash-outline" },
];

const CURRENCIES = [
  { id: "USD", label: "USD - Dólar" },
  { id: "ARS", label: "ARS - Peso argentino" },
  { id: "EUR", label: "EUR - Euro" },
  { id: "BRL", label: "BRL - Real" },
];

export default function AccountFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const { data: accounts } = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [currency, setCurrency] = useState("USD");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    if (isEditing && accounts) {
      const acc = accounts.find((a) => a.id === id);
      if (acc) {
        setName(acc.name);
        setType(acc.type);
        setCurrency(acc.currency);
        setBalance(acc.balance.toString());
      }
    }
  }, [id, accounts]);

  const handleSubmit = async () => {
    try {
      setError("");

      if (!name.trim()) {
        setError("El nombre es obligatorio");
        return;
      }

      if (isEditing) {
        await updateAccount.mutateAsync({
          id: id!,
          data: { name: name.trim(), type, currency },
        });
      } else {
        await createAccount.mutateAsync({
          name: name.trim(),
          type,
          currency,
          balance: parseFloat(balance.replace(",", ".")) || 0,
        });
      }

      router.back();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al guardar la cuenta");
    }
  };

  const selectedType = ACCOUNT_TYPES.find((t) => t.id === type);
  const selectedCurrency = CURRENCIES.find((c) => c.id === currency);
  const loading = createAccount.isPending || updateAccount.isPending;

  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="close" size={24} color="#f8f8f8" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">
            {isEditing ? "Editar cuenta" : "Nueva cuenta"}
          </Text>
        </View>

        <View className="px-6">
          <Input
            label="Nombre"
            placeholder="Ej: Mi billetera"
            value={name}
            onChangeText={setName}
          />

          <Text className="text-text-secondary text-sm mb-2 ml-1">Tipo</Text>
          <TouchableOpacity
            className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between mb-4 border border-border"
            onPress={() => setShowTypePicker(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name={(selectedType?.icon || "wallet-outline") as any} size={20} color="#c0c0f8" />
              <Text className="text-text-primary ml-3">{selectedType?.label || "Seleccionar"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#707070" />
          </TouchableOpacity>

          <Text className="text-text-secondary text-sm mb-2 ml-1">Moneda</Text>
          <TouchableOpacity
            className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between mb-4 border border-border"
            onPress={() => setShowCurrencyPicker(true)}
          >
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={20} color="#c0c0f8" />
              <Text className="text-text-primary ml-3">{selectedCurrency?.label || "USD"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#707070" />
          </TouchableOpacity>

          {!isEditing && (
            <Input
              label="Saldo inicial"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={balance}
              onChangeText={setBalance}
            />
          )}

          <ErrorMessage message={error} className="mb-4" />

          <Button
            title={isEditing ? "Guardar cambios" : "Crear cuenta"}
            onPress={handleSubmit}
            size="lg"
            loading={loading}
          />
        </View>
      </ScrollView>

      <PickerModal
        open={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        title="Tipo de cuenta"
        options={ACCOUNT_TYPES}
        selectedId={type}
        onSelect={setType}
      />

      <PickerModal
        open={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="Moneda"
        options={CURRENCIES}
        selectedId={currency}
        onSelect={setCurrency}
      />
    </ScreenLayout>
  );
}
