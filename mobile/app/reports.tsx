import { useMemo, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayout from "../components/ScreenLayout";
import Card from "../components/Card";
import LoadingScreen from "../components/LoadingScreen";
import ErrorMessage from "../components/ErrorMessage";
import { useMonthlySummary, useMonthlyTrend, useSpendingByCategory } from "../hooks/useAnalytics";

function formatCurrency(n: number) {
  return `$${Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getMonthRange() {
  const now = new Date();
  const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const start = yearAgo.toISOString().split("T")[0];
  const end = now.toISOString().split("T")[0];
  return { start, end };
}

function BarChart({ data, maxValue, color }: { data: { label: string; value: number }[]; maxValue: number; color: string }) {
  if (data.length === 0) return null;
  const barMaxHeight = 120;

  return (
    <View className="flex-row items-end justify-between mt-4" style={{ height: barMaxHeight + 20 }}>
      {data.map((d, i) => {
        const height = maxValue > 0 ? (d.value / maxValue) * barMaxHeight : 0;
        return (
          <View key={i} className="items-center flex-1">
            <Text className="text-text-muted text-xs mb-1">{formatCurrency(d.value)}</Text>
            <View
              className="w-full mx-0.5 rounded-t-sm"
              style={{ height: Math.max(height, 2), backgroundColor: color, minWidth: 8 }}
            />
            <Text className="text-text-muted text-xs mt-1">{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function DonutChart({ data }: { data: { name: string; total: number; percentage: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-text-muted">Sin datos de gastos</Text>
      </View>
    );
  }

  return (
    <View className="mt-4">
      {data.map((d, i) => (
        <View key={i} className="flex-row items-center mb-3">
          <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: d.color }} />
          <View className="flex-1">
            <View className="flex-row justify-between mb-1">
              <Text className="text-text-primary text-sm">{d.name}</Text>
              <Text className="text-text-primary text-sm font-medium">{formatCurrency(d.total)}</Text>
            </View>
            <View className="h-2 bg-bg rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${d.percentage}%`, backgroundColor: d.color }}
              />
            </View>
            <Text className="text-text-muted text-xs mt-0.5">{d.percentage}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const CATEGORY_COLORS = [
  "#c0c0f8", "#10b981", "#ef4444", "#f59e0b", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1",
  "#84cc16", "#06b6d4", "#d946ef", "#22c55e", "#e11d48",
];

export default function ReportsScreen() {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear] = useState(now.getFullYear());
  const monthRange = useMemo(() => getMonthRange(), []);
  const [refreshing, setRefreshing] = useState(false);

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useMonthlySummary(selectedYear, selectedMonth);
  const { data: trend, isLoading: loadingTrend, refetch: refetchTrend } = useMonthlyTrend(6);
  const { data: spending, isLoading: loadingSpending, refetch: refetchSpending } = useSpendingByCategory(monthRange.start, monthRange.end);

  const isLoading = loadingSummary || loadingTrend || loadingSpending;

  const barData = useMemo(() => {
    if (!trend?.months) return [];
    return trend.months.map((m) => ({
      label: m.month.slice(-2) + "/" + m.month.slice(2, 4),
      value: m.expense,
    }));
  }, [trend]);

  const maxExpense = useMemo(() => Math.max(...barData.map((d) => d.value), 1), [barData]);

  const donutData = useMemo(() => {
    if (!spending?.categories) return [];
    return spending.categories.slice(0, 10).map((c, i) => ({
      name: c.name,
      total: c.total,
      percentage: c.percentage,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));
  }, [spending]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSummary(), refetchTrend(), refetchSpending()]);
    setRefreshing(false);
  }, [refetchSummary, refetchTrend, refetchSpending]);

  if (isLoading) return <LoadingScreen message="Cargando reportes..." />;

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
          <Text className="text-text-primary text-3xl font-bold">Reportes</Text>
        </View>

        <View className="px-6 mb-4">
          <Card className="p-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-text-primary text-lg font-bold">{MONTHS[selectedMonth - 1]} {selectedYear}</Text>
            </View>
            {summary ? (
              <>
                <View className="flex-row justify-around py-4">
                  <View className="items-center">
                    <Text className="text-finance-income text-2xl font-bold">{formatCurrency(summary.total_income)}</Text>
                    <Text className="text-text-muted text-sm mt-1">Ingresos</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-finance-expense text-2xl font-bold">{formatCurrency(summary.total_expense)}</Text>
                    <Text className="text-text-muted text-sm mt-1">Gastos</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-primary-300 text-2xl font-bold">{formatCurrency(summary.balance)}</Text>
                    <Text className="text-text-muted text-sm mt-1">Balance</Text>
                  </View>
                </View>
                <Text className="text-text-muted text-xs text-center">{summary.transaction_count} transacciones</Text>
              </>
            ) : (
              <Text className="text-text-muted text-center py-4">Sin datos para este mes</Text>
            )}
          </Card>
        </View>

        <View className="px-6 mb-4">
          <Card className="p-4">
            <Text className="text-text-primary text-lg font-bold mb-2">Gastos mensuales</Text>
            <BarChart data={barData} maxValue={maxExpense} color="#ef4444" />
          </Card>
        </View>

        <View className="px-6 mb-4">
          <Card className="p-4">
            <Text className="text-text-primary text-lg font-bold mb-2">Gastos por categoría</Text>
            <DonutChart data={donutData} />
          </Card>
        </View>

        {spending?.categories && spending.categories.length > 0 && (
          <View className="px-6 mb-4">
            <Card className="p-4">
              <Text className="text-text-primary text-lg font-bold mb-2">Desglose detallado</Text>
              {spending.categories.map((c, i) => (
                <View key={i} className="flex-row justify-between py-2 border-b border-border/50">
                  <Text className="text-text-primary">{c.name}</Text>
                  <Text className="text-text-secondary">{formatCurrency(c.total)}</Text>
                </View>
              ))}
              <View className="flex-row justify-between py-2 mt-2 border-t border-border">
                <Text className="text-text-primary font-bold">Total</Text>
                <Text className="text-text-primary font-bold">{formatCurrency(spending.total)}</Text>
              </View>
            </Card>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </ScreenLayout>
  );
}
