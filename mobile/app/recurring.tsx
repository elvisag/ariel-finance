import { useMemo, useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../components/ScreenLayout";
import Card from "../components/Card";
import LoadingScreen from "../components/LoadingScreen";
import { useTransactions, useDeleteTransaction } from "../hooks/useTransactions";
import { useAccounts } from "../hooks/useAccounts";
import type { Transaction } from "../services/finance";

const FREQ_LABELS: Record<string, string> = {
  daily: "Cada día",
  weekly: "Cada semana",
  monthly: "Cada mes",
  yearly: "Cada año",
};

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function nextOccurrence(tx: Transaction): string | null {
  if (!tx.recurrence_frequency) return null;
  const lastDate = tx.recurrence_last_date ? new Date(tx.recurrence_last_date) : new Date(tx.transaction_date);
  const next = new Date(lastDate);
  switch (tx.recurrence_frequency) {
    case "daily": next.setDate(next.getDate() + 1); break;
    case "weekly": next.setDate(next.getDate() + 7); break;
    case "monthly": next.setMonth(next.getMonth() + 1); break;
    case "yearly": next.setFullYear(next.getFullYear() + 1); break;
  }
  return next.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function RecurringScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const { transactions, isLoading, refetch } = useTransactions({ is_recurring: true });
  const { data: accounts } = useAccounts();
  const deleteTx = useDeleteTransaction();

  const accountMap = useMemo(() => {
    const m: Record<string, string> = {};
    (accounts || []).forEach((a) => { m[a.id] = a.name; });
    return m;
  }, [accounts]);

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const aFreq = a.recurrence_frequency || "";
      const bFreq = b.recurrence_frequency || "";
      const order = ["daily", "weekly", "monthly", "yearly"];
      return order.indexOf(aFreq) - order.indexOf(bFreq);
    });
  }, [transactions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const confirmDelete = (tx: Transaction) => {
    Alert.alert(
      "Eliminar recurrente",
      `Se eliminará "${tx.description || "Sin descripción"}" y todas sus ocurrencias futuras dejarán de generarse.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTx.mutateAsync(tx.id);
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.detail || "No se pudo eliminar");
            }
          },
        },
      ],
    );
  };

  const confirmToggleRecurring = (tx: Transaction) => {
    Alert.alert(
      tx.is_recurring ? "Desactivar recurrencia" : "Activar recurrencia",
      `¿${tx.is_recurring ? "Desactivar" : "Activar"} la repetición para "${tx.description || "Sin descripción"}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: tx.is_recurring ? "Desactivar" : "Activar",
          onPress: () => {
            router.push({ pathname: "/(tabs)/add", params: { edit: JSON.stringify(tx) } });
          },
        },
      ],
    );
  };

  if (isLoading) return <LoadingScreen message="Cargando recurrentes..." />;

  return (
    <ScreenLayout>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c0f8" />}
      >
        <View className="px-6 pt-16 pb-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#f8f8f8" />
          </TouchableOpacity>
          <Text className="text-text-primary text-3xl font-bold">Gastos recurrentes</Text>
        </View>

        {sorted.length === 0 ? (
          <View className="flex-1 px-6 justify-center mt-16">
            <Card className="p-8 items-center">
              <Ionicons name="repeat-outline" size={48} color="#707070" />
              <Text className="text-text-muted mt-3 text-center">No tenés gastos recurrentes</Text>
              <Text className="text-text-muted text-sm text-center mt-1">
                Creá un movimiento y activá "Repetir" para verlo acá
              </Text>
              <TouchableOpacity
                className="mt-6 bg-primary-300 py-3 px-6 rounded-xl"
                onPress={() => router.push("/(tabs)/add")}
              >
                <Text className="text-bg font-semibold">Crear recurrente</Text>
              </TouchableOpacity>
            </Card>
          </View>
        ) : (
          <View className="px-6">
            <Text className="text-text-secondary text-sm mb-4 ml-1">{sorted.length} transacción(es) recurrente(s)</Text>
            {sorted.map((tx) => {
              const next = nextOccurrence(tx);
              const isExpense = tx.type === "expense";
              const color = isExpense ? "#ef4444" : "#10b981";
              return (
                <Card key={tx.id} className="mb-3 p-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${color}20` }}>
                        <Ionicons name="repeat" size={18} color={color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-text-primary font-semibold">{tx.description || "Sin descripción"}</Text>
                        <Text className="text-text-muted text-sm">
                          {accountMap[tx.account_id] || "Cuenta desconocida"}
                        </Text>
                      </View>
                    </View>
                    <Text className="font-bold" style={{ color }}>
                      {isExpense ? "-" : "+"}{formatCurrency(tx.amount)}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-4 mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color="#a0a0a0" />
                      <Text className="text-text-muted text-sm ml-1.5">{FREQ_LABELS[tx.recurrence_frequency || ""] || tx.recurrence_frequency}</Text>
                    </View>
                    {next && (
                      <View className="flex-row items-center">
                        <Ionicons name="arrow-forward" size={14} color="#c0c0f8" />
                        <Text className="text-primary-300 text-sm ml-1.5">Próxima: {next}</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center py-2 rounded-xl bg-bg border border-border"
                      onPress={() => router.push({ pathname: "/(tabs)/add", params: { edit: JSON.stringify(tx) } })}
                    >
                      <Ionicons name="create-outline" size={16} color="#a0a0a0" />
                      <Text className="text-text-secondary text-sm ml-1.5">Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-center py-2 rounded-xl bg-red-500/10"
                      onPress={() => confirmDelete(tx)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text className="text-red-400 text-sm ml-1.5">Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
        <View className="h-8" />
      </ScrollView>
    </ScreenLayout>
  );
}
