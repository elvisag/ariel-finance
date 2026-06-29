import { useMemo, useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../store/auth";
import ScreenLayout from "../../components/ScreenLayout";
import Card from "../../components/Card";
import LoadingScreen from "../../components/LoadingScreen";
import TransactionRow from "../../components/TransactionRow";
import { useAccounts } from "../../hooks/useAccounts";
import { useTransactions } from "../../hooks/useTransactions";

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
  const [refreshing, setRefreshing] = useState(false);

  const { data: accounts, isLoading: loadingAccounts, refetch: refetchAccounts } = useAccounts();
  const { data: monthTx, isLoading: loadingMonth, refetch: refetchMonth } = useTransactions({
    start_date: monthRange.start,
    end_date: monthRange.end,
  });
  const { data: recentTx, isLoading: loadingRecent, refetch: refetchRecent } = useTransactions();

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchAccounts(), refetchMonth(), refetchRecent()]);
    setRefreshing(false);
  }, [refetchAccounts, refetchMonth, refetchRecent]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenLayout>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#c0c0f8" />}
      >
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

        <View className="mx-6 mt-4">
          <TouchableOpacity
            className="bg-bg-surface p-4 rounded-2xl flex-row items-center justify-center"
            onPress={() => router.push("/reports")}
          >
            <Ionicons name="stats-chart" size={20} color="#c0c0f8" />
            <Text className="text-text-primary ml-2 font-semibold">Ver reportes</Text>
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


