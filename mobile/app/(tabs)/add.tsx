import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import ErrorMessage from "../../components/ErrorMessage";
import PickerModal from "../../components/PickerModal";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";
import { useCreateTransaction, useUpdateTransaction, useTransferMoney } from "../../hooks/useTransactions";
import type { Transaction } from "../../services/finance";

type TransactionType = "income" | "expense" | "transfer";

export default function AddScreen() {
  const params = useLocalSearchParams<{ edit?: string }>();
  const router = useRouter();
  const editData: Transaction | null = params.edit ? JSON.parse(params.edit) : null;
  const isEditing = !!editData;

  const [type, setType] = useState<TransactionType>(editData?.type || "expense");
  const [amount, setAmount] = useState(editData ? String(editData.amount) : "");
  const [description, setDescription] = useState(editData?.description || "");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(editData?.account_id || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(editData?.category_id || null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [recurring, setRecurring] = useState(editData?.is_recurring || false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(editData?.recurrence_frequency || "monthly");
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [error, setError] = useState("");

  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const transferMoney = useTransferMoney();

  const isPending = createTransaction.isPending || updateTransaction.isPending || transferMoney.isPending;

  const filteredCategories = type !== "transfer"
    ? (categories || []).filter((c) => c.type === type)
    : [];

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId);
  const selectedToAccount = accounts?.find((a) => a.id === toAccountId);
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  const handleSubmit = async () => {
    try {
      setError("");

      const parsedAmount = parseFloat(amount.replace(",", "."));
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError("Ingresá un monto válido");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      if (type === "transfer") {
        if (!selectedAccountId) {
          setError("Seleccioná la cuenta origen");
          return;
        }
        if (!toAccountId) {
          setError("Seleccioná la cuenta destino");
          return;
        }
        if (selectedAccountId === toAccountId) {
          setError("Las cuentas deben ser distintas");
          return;
        }
        await transferMoney.mutateAsync({
          from_account_id: selectedAccountId,
          to_account_id: toAccountId,
          amount: parsedAmount,
          description: description || null,
          transaction_date: today,
        });
      } else {
        if (!selectedAccountId) {
          setError("Seleccioná una cuenta");
          return;
        }
        const payload = {
          account_id: selectedAccountId,
          category_id: selectedCategoryId,
          amount: parsedAmount,
          description: description || null,
          type,
          transaction_date: editData?.transaction_date || today,
          is_recurring: recurring,
          recurrence_frequency: recurring ? recurrenceFrequency : null,
          recurrence_end_date: null,
        };
        if (isEditing && editData) {
          await updateTransaction.mutateAsync({ id: editData.id, data: payload });
        } else {
          await createTransaction.mutateAsync(payload);
        }
      }

      router.back();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al guardar la transacción");
    }
  };

  const accountOptions = (accounts || []).map((a) => ({
    id: a.id,
    label: a.name,
    subtitle: `$${a.balance.toFixed(2)}`,
    icon: "wallet-outline" as const,
  }));

  const categoryOptions = filteredCategories.map((c) => ({
    id: c.id,
    label: c.name,
    icon: (c.icon || "pricetag-outline") as keyof typeof Ionicons.glyphMap,
    color: c.color,
  }));

  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="close" size={24} color="#f8f8f8" />
          </TouchableOpacity>
          <Text className="text-text-primary text-2xl font-bold">
            {isEditing ? "Editar movimiento" : "Añadir movimiento"}
          </Text>
        </View>

        <View className="flex-row mx-6 mb-6 bg-bg-surface rounded-xl p-1">
          {(["expense", "income", "transfer"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              className={`flex-1 py-3 rounded-lg items-center ${type === t ? "bg-primary-300" : ""}`}
              onPress={() => {
                setType(t);
                setSelectedCategoryId(null);
                setToAccountId(null);
              }}
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
          <Text className="text-text-secondary text-sm mb-3">
            {type === "transfer" ? "Cuenta origen" : "Cuenta"}
          </Text>
          <TouchableOpacity
            className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between"
            onPress={() => setShowAccountPicker(true)}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="wallet-outline" size={20} color="#a0a0a0" />
              <Text className={`ml-3 ${selectedAccount ? "text-text-primary" : "text-text-muted"}`}>
                {selectedAccount ? selectedAccount.name : loadingAccounts ? "Cargando..." : "Seleccionar cuenta"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#707070" />
          </TouchableOpacity>

          {type === "transfer" && (
            <>
              <Text className="text-text-secondary text-sm mb-3 mt-4">Cuenta destino</Text>
              <TouchableOpacity
                className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between"
                onPress={() => setShowToAccountPicker(true)}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="enter-outline" size={20} color="#a0a0a0" />
                  <Text className={`ml-3 ${selectedToAccount ? "text-text-primary" : "text-text-muted"}`}>
                    {selectedToAccount ? selectedToAccount.name : loadingAccounts ? "Cargando..." : "Seleccionar cuenta destino"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#707070" />
              </TouchableOpacity>
            </>
          )}

          {type !== "transfer" && (
            <>
              <Text className="text-text-secondary text-sm mb-3 mt-4">Categoría</Text>
              <TouchableOpacity
                className="bg-bg-surface rounded-xl p-4 flex-row items-center justify-between"
                onPress={() => setShowCategoryPicker(true)}
              >
                <View className="flex-row items-center flex-1">
                  <Ionicons name="pricetag-outline" size={20} color="#a0a0a0" />
                  <Text className={`ml-3 ${selectedCategory ? "text-text-primary" : "text-text-muted"}`}>
                    {selectedCategory
                      ? selectedCategory.name
                      : loadingCategories
                        ? "Cargando..."
                        : "Seleccionar categoría"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#707070" />
              </TouchableOpacity>
            </>
          )}
        </Card>

        {type !== "transfer" && (
          <Card className="mx-6 mb-6">
            <TouchableOpacity
              className="flex-row items-center justify-between"
              onPress={() => setRecurring(!recurring)}
            >
              <View className="flex-row items-center">
                <Ionicons name="repeat" size={20} color="#c0c0f8" />
                <Text className="text-text-primary ml-3 font-medium">Repetir</Text>
              </View>
              <View className={`w-12 h-7 rounded-full ${recurring ? "bg-primary-300" : "bg-bg"} items-center justify-center border border-border`}>
                <View className={`w-5 h-5 rounded-full ${recurring ? "bg-bg ml-5" : "bg-text-muted mr-5"}`} />
              </View>
            </TouchableOpacity>

            {recurring && (
              <TouchableOpacity
                className="bg-bg rounded-xl p-4 flex-row items-center justify-between mt-4 border border-border"
                onPress={() => setShowFrequencyPicker(true)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={20} color="#a0a0a0" />
                  <Text className="text-text-primary ml-3">
                    {recurrenceFrequency === "daily" ? "Cada día"
                      : recurrenceFrequency === "weekly" ? "Cada semana"
                        : recurrenceFrequency === "monthly" ? "Cada mes"
                          : "Cada año"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#707070" />
              </TouchableOpacity>
            )}
          </Card>
        )}

        <View className="px-6 mb-8">
          <ErrorMessage message={error} className="mb-4" />
          <Button
            title={isEditing ? "Guardar cambios" : "Guardar"}
            onPress={handleSubmit}
            size="lg"
            loading={isPending}
          />
        </View>
      </ScrollView>

      <PickerModal
        open={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        title={type === "transfer" ? "Cuenta origen" : "Seleccionar cuenta"}
        options={accountOptions}
        selectedId={selectedAccountId || undefined}
        onSelect={setSelectedAccountId}
      />

      <PickerModal
        open={showToAccountPicker}
        onClose={() => setShowToAccountPicker(false)}
        title="Cuenta destino"
        options={accountOptions.filter((a) => a.id !== selectedAccountId)}
        selectedId={toAccountId || undefined}
        onSelect={setToAccountId}
      />

      {!isEditing && type !== "transfer" && (
        <PickerModal
          open={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          title="Seleccionar categoría"
          options={categoryOptions}
          selectedId={selectedCategoryId || undefined}
          onSelect={setSelectedCategoryId}
        />
      )}

      <PickerModal
        open={showFrequencyPicker}
        onClose={() => setShowFrequencyPicker(false)}
        title="Frecuencia"
        options={[
          { id: "daily", label: "Cada día" },
          { id: "weekly", label: "Cada semana" },
          { id: "monthly", label: "Cada mes" },
          { id: "yearly", label: "Cada año" },
        ]}
        selectedId={recurrenceFrequency}
        onSelect={setRecurrenceFrequency}
      />
    </ScreenLayout>
  );
}
