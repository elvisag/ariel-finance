import { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import LoadingScreen from "../../components/LoadingScreen";
import { useAccounts } from "../../hooks/useAccounts";
import { useTransactions } from "../../hooks/useTransactions";
import type { Transaction } from "../../services/finance";

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = now.toISOString().split("T")[0];
  return { start, end };
}

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const monthRange = useMemo(() => getMonthRange(), []);

  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: monthTx, isLoading: loadingMonth } = useTransactions({
    start_date: monthRange.start,
    end_date: monthRange.end,
  });
  const { data: recentTx, isLoading: loadingRecent } = useTransactions();

  const totalBalance = useMemo(
    () => (accounts || []).reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  );

  const monthIncome = useMemo(
    () => (monthTx || []).filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthTx],
  );

  const monthExpense = useMemo(
    () => (monthTx || []).filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthTx],
  );

  const recent = useMemo(() => (recentTx || []).slice(0, 5), [recentTx]);

  const isLoading = loadingAccounts && loadingMonth && loadingRecent;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenLayout>
      <ScrollView className="flex-1">
        <View className="px-6 pt-16 pb-8">
          <Text className="text-text-secondary text-lg">Hola,</Text>
          <Text className="text-text-primary text-3xl font-bold">{user?.name || "Usuario"}</Text>
        </View>

        <View className="mx-6 p-6 rounded-3xl bg-primary-300">
          <Text className="text-bg/70 text-sm">Balance total</Text>
          <Text className="text-bg text-4xl font-bold mt-1">{formatCurrency(totalBalance)}</Text>
          <View className="flex-row mt-4 gap-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-finance-income mr-2" />
              <Text className="text-bg/80">Ingresos: {formatCurrency(monthIncome)}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-finance-expense mr-2" />
              <Text className="text-bg/80">Gastos: {formatCurrency(monthExpense)}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row mx-6 mt-6 gap-4">
          <TouchableOpacity
            className="flex-1 bg-bg-surface p-4 rounded-2xl items-center"
            onPress={() => router.push("/(tabs)/add")}
          >
            <Ionicons name="trending-up" size={24} color="#10b981" />
            <Text className="text-text-primary mt-2 font-semibold">Ingreso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-bg-surface p-4 rounded-2xl items-center"
            onPress={() => router.push("/(tabs)/add")}
          >
            <Ionicons name="trending-down" size={24} color="#ef4444" />
            <Text className="text-text-primary mt-2 font-semibold">Gasto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-bg-surface p-4 rounded-2xl items-center"
            onPress={() => router.push("/(tabs)/transactions")}
          >
            <Ionicons name="swap-horizontal" size={24} color="#c0c0f8" />
            <Text className="text-text-primary mt-2 font-semibold">Ver todo</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-6 mt-8 mb-8">
          <Text className="text-text-primary text-xl font-bold mb-4">Últimos movimientos</Text>
          {recent.length === 0 ? (
            <Card className="p-8 items-center">
              <Ionicons name="receipt-outline" size={48} color="#707070" />
              <Text className="text-text-muted mt-3">No hay movimientos aún</Text>
              <TouchableOpacity
                className="mt-4 bg-primary-300 py-3 px-6 rounded-xl"
                onPress={() => router.push("/(tabs)/add")}
              >
                <Text className="text-bg font-semibold">Añadir primero</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            recent.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === "income";
  const isExpense = tx.type === "expense";
  const color = isIncome ? "#10b981" : isExpense ? "#ef4444" : "#c0c0f8";
  const icon = isIncome ? "trending-up" : isExpense ? "trending-down" : "swap-horizontal";
  const sign = isIncome ? "+" : isExpense ? "-" : "~";

  return (
    <Card className="flex-row items-center mb-2 p-4">
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${color}20` }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary font-medium">{tx.description || "Sin descripción"}</Text>
        <Text className="text-text-muted text-sm">{new Date(tx.transaction_date).toLocaleDateString("es-AR")}</Text>
      </View>
      <Text className="font-bold" style={{ color }}>
        {sign}{formatCurrency(tx.amount)}
      </Text>
    </Card>
  );
}
